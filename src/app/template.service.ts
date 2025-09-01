import { Injectable } from '@angular/core';
import { IndexeddbService } from './indexeddb.service';

export interface DocxTemplate {
  id: string;
  name: string;
  data: string; // base64 encoded template data
  uploadDate: Date;
  isDefault: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TemplateService {

  constructor(private indexeddbService: IndexeddbService) { }

  /**
   * Store a DOCX template in IndexedDB
   */
  async storeTemplate(file: File, isDefault: boolean = false): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    const template: DocxTemplate = {
      id: `template_${Date.now()}`,
      name: file.name,
      data: base64,
      uploadDate: new Date(),
      isDefault: isDefault
    };

    await this.indexeddbService.saveDocxTemplate(template);
    return template.id;
  }

  /**
   * Get all stored templates
   */
  async getTemplates(): Promise<DocxTemplate[]> {
    return await this.indexeddbService.getDocxTemplates();
  }

  /**
   * Get template by ID
   */
  async getTemplate(id: string): Promise<DocxTemplate | null> {
    return await this.indexeddbService.getDocxTemplate(id);
  }

  /**
   * Get default template (or first available template)
   */
  async getDefaultTemplate(): Promise<DocxTemplate | null> {
    const templates = await this.getTemplates();
    
    // Try to find a template marked as default
    let defaultTemplate = templates.find(t => t.isDefault);
    
    // If no default found, use the first available template
    if (!defaultTemplate && templates.length > 0) {
      defaultTemplate = templates[0];
    }

    return defaultTemplate || null;
  }

  /**
   * Delete a template
   */
  async deleteTemplate(id: string): Promise<void> {
    await this.indexeddbService.deleteDocxTemplate(id);
  }

  /**
   * Set a template as default
   */
  async setDefaultTemplate(id: string): Promise<void> {
    const templates = await this.getTemplates();
    
    // Remove default flag from all templates
    for (const template of templates) {
      template.isDefault = false;
      await this.indexeddbService.saveDocxTemplate(template);
    }

    // Set the specified template as default
    const template = await this.getTemplate(id);
    if (template) {
      template.isDefault = true;
      await this.indexeddbService.saveDocxTemplate(template);
    }
  }

  /**
   * Convert base64 template data to ArrayBuffer for easy-template-x
   */
  templateToArrayBuffer(template: DocxTemplate): ArrayBuffer {
    const binaryString = atob(template.data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Create a basic default template if none exists
   */
  async createDefaultTemplate(): Promise<void> {
    const templates = await this.getTemplates();
    
    // Always allow creating a new sample template
    const templateContent = this.getSampleTemplateInstructions();
    const blob = new Blob([templateContent], { type: 'text/plain' });
    const file = new File([blob], 'sample-template-instructions.txt', { type: blob.type });
    
    // Since we can't create a real DOCX programmatically easily,
    // we'll create an instructions file instead
    const link = document.createElement('a');
    const url = window.URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'vulnrepo-template-guide.txt');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Get sample template instructions
   */
  private getSampleTemplateInstructions(): string {
    return `VULNREPO DOCX TEMPLATE GUIDE
================================

To create a custom DOCX template for VulnRepo:

1. Create a new Word document (.docx)
2. Design your report layout as you want it to appear
3. Insert placeholders for dynamic content using the syntax below
4. Save the document and upload it through VulnRepo Settings

AVAILABLE PLACEHOLDERS:
======================

Basic Information:
- {report_name} - The name of the report
- {report_id} - Unique report identifier  
- {report_version} - Report version number
- {create_date} - Report creation date
- {last_update} - Last modification date
- {current_date} - Current date
- {scope} - Testing scope description
- {summary} - Report summary/overview

Statistics:
- {total_issues} - Total number of vulnerabilities found
- {critical_count} - Number of critical severity issues
- {high_count} - Number of high severity issues  
- {medium_count} - Number of medium severity issues
- {low_count} - Number of low severity issues
- {info_count} - Number of informational issues

Logo:
- {logo} - Company/report logo (if uploaded)

LOOPS (for repeating sections):
==============================

Issues Loop:
{#issues}
  Issue #{index}: {title}
  Severity: {severity}
  CVSS Score: {cvss}
  
  Description:
  {description}
  
  Proof of Concept:
  {proof_of_concept}
  
  References:
  {references}
  
  CVE: {cve}
  Tags: {tags}
{/issues}

Changelog Loop:  
{#changelog}
  {date}: {description}
{/changelog}

Researchers Loop:
{#researchers}
  Name: {name}
  Email: {email}
  Role: {role}
{/researchers}

EXAMPLE TEMPLATE STRUCTURE:
==========================

{logo}

VULNERABILITY ASSESSMENT REPORT
Report: {report_name}
ID: {report_id}
Version: {report_version}
Date: {create_date}

EXECUTIVE SUMMARY
=================
This report presents the findings of a security assessment conducted on {current_date}.

Total Issues: {total_issues}
- Critical: {critical_count}
- High: {high_count}  
- Medium: {medium_count}
- Low: {low_count}
- Info: {info_count}

SCOPE
=====
{scope}

DETAILED FINDINGS
================
{#issues}
Finding #{index}: {title}
Severity: {severity}
CVSS: {cvss}

Description:
{description}

Proof of Concept:
{proof_of_concept}

References:
{references}

---
{/issues}

REPORT SUMMARY
==============
{summary}

RESEARCH TEAM
=============
{#researchers}
{name} - {role}
Email: {email}
{/researchers}

CHANGELOG
=========
{#changelog}
{date}: {description}
{/changelog}

{generated_by}

NOTES:
======
- Use {#loop}...{/loop} for repeating content
- All placeholders are case-sensitive
- You can style the document normally in Word
- Tables, images, and formatting will be preserved
- For more advanced features, see: https://github.com/alonrbar/easy-template-x
`;
  }
}
