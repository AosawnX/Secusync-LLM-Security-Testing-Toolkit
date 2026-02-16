import os
import io
import zipfile
from jinja2 import Environment, FileSystemLoader
from xhtml2pdf import pisa
from app.models.run import Run

RUNS_DIR = "runs"
TEMPLATES_DIR = "app/templates"

class ReportService:
    def __init__(self):
        self.env = Environment(loader=FileSystemLoader(TEMPLATES_DIR))

    def _convert_html_to_pdf(self, source_html, output_filename):
        # Utility to generate PDF
        with open(output_filename, "wb") as result_file:
            pisa_status = pisa.CreatePDF(
                source_html,                # the HTML to convert
                dest=result_file            # file handle to recieve result
            )
        return pisa_status.err

    async def generate_technical_report(self, run: Run, judge_connector) -> str:
        """Generates a Technical Report (PDF) with AI insights and returns the file path."""
        # 1. Generate Technical Insights using LLM
        findings_text = "\n".join([f"- [{f.get('severity', 'UNKNOWN')}] {f.get('description', '')}" for f in (run.findings or [])])
        technical_prompt = f"""
        You are a Senior Security Engineer.
        Analyze the following vulnerability findings from a technical perspective.
        
        1. Explain the ROOT CAUSE of the vulnerabilities (e.g., Prompt Injection, IDOR, Info Leak).
        2. Provide specific REMEDIATION steps for developers (code snippets or config changes).
        3. Explain WHY these are dangerous in a production environment.
        
        Findings:
        {findings_text}
        
        Target ID: {run.target_id}
        """
        
        technical_summary = "No findings to analyze."
        if run.findings and judge_connector:
            try:
                technical_summary = await judge_connector.send_prompt(technical_prompt)
            except Exception as e:
                technical_summary = f"Could not generate insights: {e}"

        template = self.env.get_template("report.html")
        html_content = template.render(
            run=run, 
            report_type="Technical Report",
            technical_summary=technical_summary,
            is_technical=True
        )
        
        report_path = os.path.join(RUNS_DIR, run.id, "technical_report.pdf")
        self._convert_html_to_pdf(html_content, report_path)
            
        return report_path

    async def generate_executive_report(self, run: Run, judge_connector) -> str:
        """Generates an Executive Report (PDF) using LLM summary and returns the file path."""
        # 1. Generate Summary using LLM
        findings_text = "\n".join([f"- [{f.get('severity', 'UNKNOWN')}] {f.get('description', '')}" for f in (run.findings or [])])
        summary_prompt = f"""
        You are a Cyber Security Executive Consultant. 
        Summarize the following security findings for a C-Level Executive.
        Focus on Business Impact, Risk Level, and Strategic Recommendations.
        Keep it professional, concise, and actionable.

        Findings:
        {findings_text}
        
        Target ID: {run.target_id}
        Vulnerability Score: {run.vulnerability_score}/10
        """
        
        executive_summary = "No findings to summarize."
        if run.findings and judge_connector:
            try:
                executive_summary = await judge_connector.send_prompt(summary_prompt)
            except Exception as e:
                executive_summary = f"Could not generate summary: {e}"

        # 2. Render HTML
        template = self.env.get_template("report.html") # We can reuse report.html or create executive.html
        # reusing report.html for now but injecting the summary
        html_content = template.render(
            run=run, 
            report_type="Executive Report",
            executive_summary=executive_summary,
            is_executive=True
        )
        
        report_path = os.path.join(RUNS_DIR, run.id, "executive_report.pdf")
        self._convert_html_to_pdf(html_content, report_path)
        return report_path

    def generate_poc_bundle(self, run: Run) -> str:
        """Generates a ZIP bundle with a Markdown Reproduction Guide."""
        if not run.findings:
            return None

        # Create Guide Content
        guide_content = f"""# Reproduction Guide for Run {run.id}

## Target Information
- **Target ID**: {run.target_id}
- **Date**: {run.created_at}

## Vulnerabilities Found
"""
        for i, finding in enumerate(run.findings):
             guide_content += f"\n### {i+1}. {finding.get('description', 'Unknown Issue')}\n"
             guide_content += f"- **Severity**: {finding.get('severity', 'Unknown')}\n"
             # If we had the exact prompt that caused this finding in the finding object, we'd list it.
             # Currently findings might just be descriptions.
             # Assuming finding description contains prompt info or we can map it?
             # For now, let's just list what we have.
        
        guide_content += "\n## Reproduction Steps\n1. Configure the target system as per the profile.\n2. Send the prompts listed above.\n3. Observe the response for leaked information.\n"

        zip_path = os.path.join(RUNS_DIR, run.id, "poc_bundle.zip")
        with zipfile.ZipFile(zip_path, 'w') as zipf:
            zipf.writestr("Reproduction_Guide.md", guide_content)
            
        return zip_path
