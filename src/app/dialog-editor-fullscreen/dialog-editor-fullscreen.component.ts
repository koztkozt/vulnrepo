import { Component, Inject, OnInit, ElementRef, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormControl } from '@angular/forms';

import DOMPurify from 'dompurify';
import { markedHighlight } from "marked-highlight";
import hljs from 'highlight.js';
import { Marked } from "marked";

export interface Table {
  type: 'table';
  raw: string;
  align: Array<'center' | 'left' | 'right' | null>;
  header: TableCell[];
  rows: TableCell[][];
}

export interface TableRow {
  text: string;
}

export interface TableCell {
  text: string;
  header: boolean;
  align: 'center' | 'left' | 'right' | null;
}

@Component({
  selector: 'app-dialog-editor-fullscreen',
  standalone: false,
  //imports: [],
  templateUrl: './dialog-editor-fullscreen.component.html',
  styleUrl: './dialog-editor-fullscreen.component.scss'
})
export class DialogEditorFullscreenComponent implements OnInit {


  previewfield = new UntypedFormControl();
  showprev = false;
  showImages = false; // Show/hide image gallery
  selectedtextarea: any;
  selectedtextarea_start: any;
  selectedtextarea_end: any;
  pocImages: any[] = []; // Store PoC images

  @ViewChild('textareaEl', { static: false}) textareaElement: ElementRef<HTMLTextAreaElement>;
  // @ts-ignore
  constructor(public dialogRef: MatDialogRef<DialogEditorFullscreenComponent>,@Inject(MAT_DIALOG_DATA) public data: any) {}

  ngOnInit() {

    if(this.data) {
      // Handle both old format (string) and new format (object with content + images)
      if (typeof this.data === 'string') {
        // Legacy format: just content
        this.poc_preview_funct(this.data);
      } else {
        // New format: object with content and pocImages
        const content = this.data.content || '';
        this.pocImages = this.data.pocImages || [];
        this.data = content; // Set data to the content string
        this.poc_preview_funct(this.data);
        
        // Show images gallery if there are images
        if (this.pocImages.length > 0) {
          this.showImages = true;
        }
      }
    }
  
  }

  // Handle clipboard paste for images
  onPaste(event: ClipboardEvent): void {
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    const items = clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Check if the item is an image
      if (item.type.startsWith('image/')) {
        event.preventDefault(); // Prevent default paste behavior
        
        const file = item.getAsFile();
        if (file) {
          this.processImageFile(file);
        }
        break;
      }
    }
  }

  // Process image file and insert into markdown
  processImageFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataURL = e.target?.result as string;
      const imageId = 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      // Store image data
      const imageData = {
        id: imageId,
        data: dataURL,
        filename: file.name || 'pasted_image.png',
        type: file.type,
        size: file.size
      };
      
      this.pocImages.push(imageData);
      
      // Insert markdown image syntax with short reference
      const imageMarkdown = `![${imageData.filename}](poc-img:${imageId})`;
      this.insertAtCursor(imageMarkdown);
      
      // Update preview
      this.poc_preview_funct(this.data);
      
      // Auto-show gallery if this is the first image
      if (this.pocImages.length === 1) {
        this.showImages = true;
      }
    };
    
    reader.readAsDataURL(file);
  }

  // Handle drag over event
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  // Handle drop event for images
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (file.type.startsWith('image/')) {
        this.processImageFile(file);
        break; // Only process first image
      }
    }
  }

  // Insert image reference from gallery
  insertImageReference(img: any): void {
    const imageMarkdown = `![${img.filename}](poc-img:${img.id})`;
    this.insertAtCursor(imageMarkdown);
    this.poc_preview_funct(this.data);
  }

  // Remove PoC image
  removePoCImage(img: any): void {
    const index = this.pocImages.indexOf(img);
    if (index > -1) {
      this.pocImages.splice(index, 1);
      
      // Remove all references to this image from markdown
      const imageRef = `poc-img:${img.id}`;
      const regex = new RegExp(`!\\[[^\\]]*\\]\\(${imageRef.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g');
      this.data = this.data.replace(regex, '[Removed Image]');
      
      this.poc_preview_funct(this.data);
      
      // Hide gallery if no images left
      if (this.pocImages.length === 0) {
        this.showImages = false;
      }
    }
  }

  // Insert text at current cursor position
  insertAtCursor(text: string): void {
    const start = this.selectedtextarea_start || 0;
    const end = this.selectedtextarea_end || 0;
    
    this.data = this.data.slice(0, start) + text + this.data.slice(end);
    
    // Set cursor after inserted text
    const newPosition = start + text.length;
    this.selectedtextarea_start = newPosition;
    this.selectedtextarea_end = newPosition;
    
    // Focus textarea and set cursor
    setTimeout(() => {
      if (this.textareaElement) {
        this.textareaElement.nativeElement.focus();
        this.textareaElement.nativeElement.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  }

  saniteizeme(code) {
      return DOMPurify.sanitize(code);
  }

  cancel(): void {
    this.dialogRef.close({
      content: this.data,
      pocImages: this.pocImages
    });
  }

  poc_preview_funct(value): void {

    const marked = new Marked(
      markedHighlight({
      emptyLangClass: 'hljs',
        langPrefix: 'hljs language-',
        highlight(code, lang, info) {
          const language = hljs.getLanguage(lang) ? lang : 'plaintext';
          return hljs.highlight(code, { language }).value;
        }
      })
    );

    const applyLineNumbers = (code: string) => {
        const lines = code.trim().split('\n');
      
        const rows = lines.map((line, idx) => {
          const lineNumber = idx + 1;
      
          let html = '<tr>';
    	    html += `<td class="line-number">${lineNumber}</td>`;
          html += `<td class="code-line">${line}</td>`;
      	    html += '</tr>';
      	    return html;
        });
      	
        return `<table><tbody>${rows.join('')}</tbody></table>`;
      };


    // add Markdown rendering
    const renderer = new marked.Renderer();
    renderer.code = function (token) {
      token.text = applyLineNumbers(token.text);
      return `<pre class="hljs"><code>` + DOMPurify.sanitize(token.text) + `</code></pre>`;
    };

    renderer.blockquote = function (token) {
      return `<blockquote><p>` + DOMPurify.sanitize(token.text) + `</p></blockquote>`;
    };

    renderer.image = function (token) {
      // Handle PoC image references
      if (token.href.startsWith('poc-img:')) {
        const imageId = token.href.replace('poc-img:', '');
        const imageData = this.pocImages.find(img => img.id === imageId);
        
        if (imageData) {
          return `<img src="` + DOMPurify.sanitize(imageData.data) + `" alt="` + DOMPurify.sanitize(token.text || '') + `" title="` + DOMPurify.sanitize(token.title || '') + `" style="max-width: 100%; height: auto; border: 1px solid #ddd; margin: 5px 0;">`;
        } else {
          return `<div style="padding: 10px; border: 2px dashed #ccc; text-align: center; color: #666;">[Missing Image: ${DOMPurify.sanitize(token.text || 'Unknown')}]</div>`;
        }
      }
      // Enable image rendering for data URLs (for backward compatibility)
      else if (token.href.startsWith('data:image/')) {
        return `<img src="` + DOMPurify.sanitize(token.href) + `" alt="` + DOMPurify.sanitize(token.text || '') + `" title="` + DOMPurify.sanitize(token.title || '') + `" style="max-width: 100%; height: auto; border: 1px solid #ddd; margin: 5px 0;">`;
      }
      // For non-data URLs, return as text (security)
      return DOMPurify.sanitize(token.href);
    }.bind(this);

    renderer.link = function( token: any ) {

    try {
      var prot = decodeURIComponent(unescape(token.href))
        .replace(/[^\w:]/g, '')
        .toLowerCase();
    } catch (e) {
      return token.text;
    }
    if (prot.indexOf('javascript:') === 0 || prot.indexOf('vbscript:') === 0 || prot.indexOf('data:') === 0) {
      return token.text;
    }

      return '<a target="_blank" class="active-link" rel="nofollow" href="'+ DOMPurify.sanitize(token.href) +'" title="' + DOMPurify.sanitize(token.title) + '">' + DOMPurify.sanitize(token.text) + '</a>';
    }

    renderer.table = function(token: any) {

      const header = token.header.map((res:any) => {
        return "<th class='titlepad'>"+DOMPurify.sanitize(res.text)+"</th>";
      }).join("");

      const body = token.rows.map((res:any) => {
        return "<tr>" + res.map((res2:any) => {
          return "<td class='tableb'>"+DOMPurify.sanitize(res2.text)+"</td>";
        }).join("") + "</tr>";
      }).join("");

        return "<div class='table-responsive'><table class='tablemd'><thead class='tablemd'><tr>" + header + "</tr></thead><tbody>" + body + "</tr></tbody></table></div>";      
    }

    this.previewfield.setValue(marked.parse(value, { renderer: renderer }));
  }

  onChange(event) {
    this.poc_preview_funct(event);
  }

  onclick(event) {
    const start = event.target.selectionStart;
    const end = event.target.selectionEnd;
    this.selectedtextarea_start = start;
    this.selectedtextarea_end = end;
 }

  select(event) {
    const start = event.target.selectionStart;
    const end = event.target.selectionEnd;

    this.selectedtextarea = event.target.value.substr(start, end - start);
    this.selectedtextarea_start = start;
    this.selectedtextarea_end = end;
    
 }

  parseBold(data) {
    if(this.selectedtextarea_start === this.selectedtextarea_end) {
      this.selectedtextarea = 'bold';
    }
    this.data = data.slice(0, this.selectedtextarea_start) + '**' + this.selectedtextarea + '**' + data.slice(this.selectedtextarea_end);

    const setcursor = this.selectedtextarea_end + 4;
    setTimeout(() => {
      this.textareaElement.nativeElement.focus();
      this.textareaElement.nativeElement.setSelectionRange(setcursor,setcursor);
    });

    this.poc_preview_funct(this.data);
  }

  parseItalic(data) {
    if(this.selectedtextarea_start === this.selectedtextarea_end) {
      this.selectedtextarea = 'emphasized text';
    }
    this.data = data.slice(0, this.selectedtextarea_start) + ' _' + this.selectedtextarea + '_ ' + data.slice(this.selectedtextarea_end);

    const setcursor = this.selectedtextarea_end + 4;
    setTimeout(() => {
      this.textareaElement.nativeElement.focus();
      this.textareaElement.nativeElement.setSelectionRange(setcursor,setcursor);
    });

    this.poc_preview_funct(this.data);
  }

  parseHeading(data) {
    if(this.selectedtextarea_start === this.selectedtextarea_end) {
      this.selectedtextarea = 'heading text';
    }
    this.data = data.slice(0, this.selectedtextarea_start) + '\n# ' + this.selectedtextarea + '' + data.slice(this.selectedtextarea_end);

    const setcursor = this.selectedtextarea_end + 4;
    setTimeout(() => {
      this.textareaElement.nativeElement.focus();
      this.textareaElement.nativeElement.setSelectionRange(setcursor,setcursor);
    });

    this.poc_preview_funct(this.data);
  }

  parseStrikethrough(data) {
    if(this.selectedtextarea_start === this.selectedtextarea_end) {
      this.selectedtextarea = 'strikethrough';
    }
    this.data = data.slice(0, this.selectedtextarea_start) + '~~' + this.selectedtextarea + '~~' + data.slice(this.selectedtextarea_end);

    const setcursor = this.selectedtextarea_end + 4;
    setTimeout(() => {
      this.textareaElement.nativeElement.focus();
      this.textareaElement.nativeElement.setSelectionRange(setcursor,setcursor);
    });

    this.poc_preview_funct(this.data);
  }

  parseLink(data) {
    if(this.selectedtextarea_start === this.selectedtextarea_end) {
      this.selectedtextarea = 'enter link description here';
    }
    this.data = data.slice(0, this.selectedtextarea_start) + '[' + this.selectedtextarea + '](https://vulnrepo.com/)' + data.slice(this.selectedtextarea_end);

    const setcursor = this.selectedtextarea_end + 24;
    setTimeout(() => {
      this.textareaElement.nativeElement.focus();
      this.textareaElement.nativeElement.setSelectionRange(setcursor,setcursor);
    });

    this.poc_preview_funct(this.data);
  }

  parseList(data) {
    if(this.selectedtextarea_start === this.selectedtextarea_end) {
      this.selectedtextarea = 'list text';
    }

    const lists = this.selectedtextarea.split('\n');
    if(lists.length > 1) {
      this.selectedtextarea = lists.join('\n- ');
    }

    this.data = data.slice(0, this.selectedtextarea_start) + '\n- ' + this.selectedtextarea + '\n' + data.slice(this.selectedtextarea_end);

    const setcursor = this.selectedtextarea_end + 6;
    setTimeout(() => {
      this.textareaElement.nativeElement.focus();
      this.textareaElement.nativeElement.setSelectionRange(setcursor,setcursor);
    });

    this.poc_preview_funct(this.data);
  }

  parseCode(data) {
    if(this.selectedtextarea_start === this.selectedtextarea_end) {
      this.selectedtextarea = 'code text';
    }
    this.data = data.slice(0, this.selectedtextarea_start) + '\n```\n' + this.selectedtextarea + '\n```\n' + data.slice(this.selectedtextarea_end);

    const setcursor = this.selectedtextarea_end + 14;
    setTimeout(() => {
      this.textareaElement.nativeElement.focus();
      this.textareaElement.nativeElement.setSelectionRange(setcursor,setcursor);
    });

    this.poc_preview_funct(this.data);
  }

  parseQuote(data) {
    if(this.selectedtextarea_start === this.selectedtextarea_end) {
      this.selectedtextarea = 'quote';
    }
    this.data = data.slice(0, this.selectedtextarea_start) + '\n> ' + this.selectedtextarea + '\n' + data.slice(this.selectedtextarea_end);

    const setcursor = this.selectedtextarea_end + 6;
    setTimeout(() => {
      this.textareaElement.nativeElement.focus();
      this.textareaElement.nativeElement.setSelectionRange(setcursor,setcursor);
    });

    this.poc_preview_funct(this.data);
  }

  parseTable(data) {

    this.selectedtextarea = `IP   | hostname | role | comments\n------|--------------|-------|---------------\n127.0.0.1 | localhost.localdomain | PROD | sql inj here`;

    this.data = data.slice(0, this.selectedtextarea_start) + '\n' + this.selectedtextarea + '\n' + data.slice(this.selectedtextarea_end);

    const setcursor = this.selectedtextarea_end + 4;
    setTimeout(() => {
      this.textareaElement.nativeElement.focus();
      this.textareaElement.nativeElement.setSelectionRange(setcursor,setcursor);
    });

    this.poc_preview_funct(this.data);
  }
}
