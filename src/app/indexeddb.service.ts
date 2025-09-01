import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { v4 as uuid } from 'uuid';
import * as Crypto from 'crypto-js';
import { Observable } from 'rxjs';

import { MessageService } from './message.service';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { ApiService } from './api.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SessionstorageserviceService } from "./sessionstorageservice.service"
import { CurrentdateService } from './currentdate.service';

@Injectable({
  providedIn: 'root'
})
export class IndexeddbService {

  reportlist = [];

  private decryptstatusObs = new Subject<any>();
  public changesStatus = new Subject<any>();

  constructor(public router: Router, private messageService: MessageService, public dialog: MatDialog,
    private apiService: ApiService, private snackBar: MatSnackBar, public sessionsub: SessionstorageserviceService,
    private currentdateService: CurrentdateService) {

    this.updateEncStatus(false);
    /*
    const test = [
      {
        report_id: '07f8026e-23c9-40f8-9001-53c3240a2c7d',
        report_name: 'Testing security infrastructure apple.com',
        report_createdate: 1541259311298,
        encrypted_data: 'encdata'
      },
      {
        report_id: '64f8026e-23c9-40f8-9001-53c3240a2c7d',
        report_name: 'PCI DSS Security report',
        report_createdate: 1541260948293,
        encrypted_data: 'encdata'
      }
    ];

    this.reportlist.push(test);
    this.Obsreportlist.next(test);
    */
  }

  getReports() {
    return new Promise<any>((resolve, reject) => {

      const indexedDB = window.indexedDB;
      const open = indexedDB.open('vulnrepo-db', 1);

      open.onupgradeneeded = function () {
        const db = open.result;
        db.createObjectStore('reports', { autoIncrement: true });
      };

      open.onsuccess = function () {
        const db = open.result;
        const tx = db.transaction('reports', 'readwrite');
        const store = tx.objectStore('reports');

        // add, clear, count, delete, get, getAll, getAllKeys, getKey, put
        const request = store.getAll();

        request.onsuccess = function (evt) {
          resolve(request.result);
        };

        tx.oncomplete = function () {
          db.close();
        };
        request.onerror = function (e) {
          reject(e);
        };
      };

    });
  }

  setProfile(base_array, profile) {

    if (profile) {

      base_array.report_settings.report_logo.logo = profile.logo;
      base_array.report_settings.report_logo.width = profile.logow;
      base_array.report_settings.report_logo.height = profile.logoh;

      base_array.researcher[0].reportername = profile.ResName;
      base_array.researcher[0].reportersocial = profile.ResSocial;
      base_array.researcher[0].reporterwww = profile.ResWeb;
      base_array.researcher[0].reporteremail = profile.ResEmail;

      base_array.report_settings.report_theme = profile.theme;

      base_array.report_settings.report_css = profile.report_css;
      base_array.report_settings.report_html = profile.report_custom_content;
      base_array.report_settings.report_video_embed = profile.video_embed;
      base_array.report_settings.report_remove_lastpage = profile.remove_lastpage;
      base_array.report_settings.report_remove_issuestatus = profile.remove_issueStatus;
      base_array.report_settings.report_remove_issuecvss = profile.remove_issuecvss;
      base_array.report_settings.report_remove_issuecve = profile.remove_issuecve;
      base_array.report_settings.report_remove_researchers = profile.remove_researcher;
      base_array.report_settings.report_changelog_page = profile.remove_changelog;
      base_array.report_settings.report_remove_issuetags = profile.remove_tags;
      base_array.report_settings.report_parsing_desc = profile.report_parsing_desc;
      base_array.report_settings.report_parsing_poc_markdown = profile.report_parsing_poc_markdown;

    }

    return base_array;

  }

  addnewReport(title: string, pass: string, profile: any) {

    if (title && pass) {

      // detect space in pass
      if (/\s/.test(pass)) {
        console.log('space');

      } else {



        //        report_vulns: [
        //          {
        //            title: '[XSS] Cross site scripting vulnerability',
        //            poc: '',
        //            files: [],
        //            desc: 'desc',
        //            severity: 'Medium',
        //            status: 1,
        //            ref: 'https://www.owasp.org/',
        //            cvss: '4.3',
        //            cve: '',
        //            tags: [],
        //            bounty: [],
        //            date: today
        //          },
        //          {
        //            title: '[XSS] DOM',
        //            poc: '',
        //            files: [],
        //            desc: 'desc',
        //            severity: 'Medium',
        //            status: 1,
        //            ref: 'https://www.owasp.org/',
        //            cvss: '4.3',
        //            cve: '',
        //            tags: [],
        //            bounty: [],
        //            date: today
        //          }
        //        ],


        const defaultContent = `### Methodology and Standards:

* OSTTMM(Open Source Security Testing Methodology Manual)
* OWASP(Open Web Application Security Project)
* ISSAF(Information Systems Security Assessment Framework)
* WASC-TC(Web Application Security Consortium Threat Classification)
* PTF(Penetration Testing Framework)
* OISSG(Information Systems Security Assessment Framework)
* NIST SP800-115(Technical Guide to Information Security Testing and Assessment)
`;

        const today: number = Date.now();

        let empty_vulns = {
          report_vulns: [],
          report_scope: '',
          report_summary: '',
          report_changelog: [
            {
              date: today,
              desc: 'Create report: \"' + title + '\".'
            }
          ],
          report_version: 0,
          report_metadata: {
            starttest: today,
            endtest: ''
          },
          researcher: [
            {
              reportername: '',
              reportersocial: '',
              reporterwww: '',
              reporteremail: ''
            }
          ],
          report_settings: {
            report_html: defaultContent,
            report_logo: {
              logo: '',
              width: 600,
              height: 500
            },
            report_theme: 'white',
            report_video_embed: true,
            report_remove_lastpage: false,
            report_remove_issuestatus: false,
            report_remove_issuecvss: true,
            report_remove_issuecve: true,
            report_remove_researchers: false,
            report_changelog_page: false,
            report_remove_issuetags: false,
            report_parsing_desc: false,
            report_parsing_poc_markdown: true
          }
        };

        // check profile and set profile
        empty_vulns = this.setProfile(empty_vulns, profile);

        // Encrypt
        const ciphertext = Crypto.AES.encrypt(JSON.stringify(empty_vulns), pass);
        const reportId = uuid();
        const data = {
          report_id: reportId,
          report_name: title,
          report_createdate: today,
          report_lastupdate: '',
          encrypted_data: ciphertext.toString()
        };

        // indexeddb communication
        const indexedDB = window.indexedDB;
        const open = indexedDB.open('vulnrepo-db', 1);

        open.onupgradeneeded = function () {
          const db = open.result;
          db.createObjectStore('reports', { autoIncrement: true });
        };

        open.onsuccess = function () {
          const db = open.result;
          const tx = db.transaction('reports', 'readwrite');
          const store = tx.objectStore('reports');

          store.put(data);

          tx.oncomplete = function () {
            db.close();
          };
        };


        this.sessionsub.setSessionStorageItem(reportId, pass);
        this.router.navigate(['/my-reports']);


      }

    }

  }

  addnewReportonAPI(apiurl: string, apikey: string, title: string, pass: string, profile: any) {

    if (title && pass) {

      // detect space in pass
      if (/\s/.test(pass)) {
        console.log('space');

      } else {

        const defaultContent = `### Methodology and Standards:

* OSTTMM(Open Source Security Testing Methodology Manual)
* OWASP(Open Web Application Security Project)
* ISSAF(Information Systems Security Assessment Framework)
* WASC-TC(Web Application Security Consortium Threat Classification)
* PTF(Penetration Testing Framework)
* OISSG(Information Systems Security Assessment Framework)
* NIST SP800-115(Technical Guide to Information Security Testing and Assessment)
`;

        const today: number = Date.now();

        let empty_vulns = {
          report_vulns: [],
          report_scope: '',
          report_summary: '',
          report_changelog: [
            {
              date: today,
              desc: 'Create report: \"' + title + '\".'
            }
          ],
          report_version: 0,
          report_metadata: {
            starttest: today,
            endtest: ''
          },
          researcher: [
            {
              reportername: '',
              reportersocial: '',
              reporterwww: '',
              reporteremail: ''
            }
          ],
          report_settings: {
            report_html: defaultContent,
            report_logo: {
              logo: '',
              width: 600,
              height: 500
            }
          }
        };

        // check profile and set profile
        empty_vulns = this.setProfile(empty_vulns, profile);

        // Encrypt
        const ciphertext = Crypto.AES.encrypt(JSON.stringify(empty_vulns), pass);
        const reportid = uuid();
        const data = {
          report_id: reportid,
          report_name: title,
          report_createdate: today,
          report_lastupdate: '',
          encrypted_data: ciphertext.toString()
        };


        // tslint:disable-next-line:max-line-length
        this.apiService.APISend(apiurl, apikey, 'savereport', 'reportdata=' + btoa(JSON.stringify(data))).then(resp => {
          if (resp) {

            if (resp.STORAGE === 'NOSPACE') {
              this.snackBar.open('API ERROR: NO SPACE LEFT!', 'OK', {
                duration: 3000,
                panelClass: ['notify-snackbar-fail']
              });
            } else {
              this.sessionsub.setSessionStorageItem(reportid, pass);
              this.router.navigate(['/my-reports']);
            }

          }
        });


      }

    }

  }


  importReport(data) {
    return new Promise<any>((resolve, reject) => {
    data = JSON.parse(data);
    // indexeddb communication
    const indexedDB = window.indexedDB;
    const open = indexedDB.open('vulnrepo-db', 1);

    open.onupgradeneeded = function () {
      const db = open.result;
      db.createObjectStore('reports', { autoIncrement: true });
    };

    open.onsuccess = function () {
      const db = open.result;
      const tx = db.transaction('reports', 'readwrite');
      const store = tx.objectStore('reports');

      store.put(data);

      tx.oncomplete = function () {
        db.close();
        resolve(true);
      };
    };


    });
  }



  importReportfromfile(data) {
    data = JSON.parse(data);
    // indexeddb communication
    const indexedDB = window.indexedDB;
    const open = indexedDB.open('vulnrepo-db', 1);

    open.onupgradeneeded = function () {
      const db = open.result;
      db.createObjectStore('reports', { autoIncrement: true });
    };

    open.onsuccess = function () {
      const db = open.result;
      const tx = db.transaction('reports', 'readwrite');
      const store = tx.objectStore('reports');

      store.put(data);

      tx.oncomplete = function () {
        db.close();
      };
    };

  }


  importReportfromfileSettings(data) {

    // indexeddb communication
    const indexedDB = window.indexedDB;
    const open = indexedDB.open('vulnrepo-db', 1);

    open.onupgradeneeded = function () {
      const db = open.result;
      db.createObjectStore('reports', { autoIncrement: true });
    };

    open.onsuccess = function () {
      const db = open.result;
      const tx = db.transaction('reports', 'readwrite');
      const store = tx.objectStore('reports');

      store.put(data);

      tx.oncomplete = function () {
        db.close();
      };
    };

  }


  deleteReport(item: any, removehistory: any) {
    return new Promise<any>((resolve, reject) => {
      this.getkeybyReportID(item.report_id).then(data => {
        if (data) {

          if (data.NotFound === 'NOOK') {
            console.log('no locally report');
          } else {

            if (removehistory) {
              //remove from history
              this.removeReporthistory(item.report_id).then(data => { });
            }

            // indexeddb communication
            const indexedDB = window.indexedDB;
            const open = indexedDB.open('vulnrepo-db', 1);

            open.onupgradeneeded = function () {
              const db = open.result;
              db.createObjectStore('reports', { autoIncrement: true });
            };

            open.onsuccess = function () {
              const db = open.result;
              const tx = db.transaction('reports', 'readwrite');
              const store = tx.objectStore('reports');

              store.delete(data.key);

              tx.oncomplete = function () {
                db.close();
                resolve(true);
              };
            };
          }

        }
      });
    });
  }


  checkifreportexist(report_id: string) {
    return new Promise<any>((resolve, reject) => {
      // indexeddb communication
      const indexedDB = window.indexedDB;
      const open = indexedDB.open('vulnrepo-db', 1);

      open.onupgradeneeded = function () {
        const db = open.result;
        db.createObjectStore('reports', { autoIncrement: true });
      };

      open.onsuccess = function () {
        const db = open.result;
        const tx = db.transaction('reports', 'readwrite');
        const store = tx.objectStore('reports');
        const request = store.getAll();
        request.onsuccess = function (evt) {
          request.result.forEach((item) => {
            if (item.report_id === report_id) {
              resolve(item);
            }
          });
        };
        tx.oncomplete = function () {
          db.close();
          resolve(false);
        };
        request.onerror = function (e) {
          reject(e);
        };
      };
    });
  }

  decrypt(pass: string, report_id: string): Promise<any> {
    return this.checkifreportexist(report_id).then(data => {
      if (data) {
        return this.decodeAES(data, pass);
      }
    });
  }



  decodeAES(data: any, pass: string) {

    try {
      // Decrypt
      const bytes = Crypto.AES.decrypt(data.encrypted_data.toString(), pass);
      const decryptedData = JSON.parse(bytes.toString(Crypto.enc.Utf8));
      if (decryptedData) {
        this.sessionsub.setSessionStorageItem(data.report_id, pass);
      }
      this.updateEncStatus(true);
      this.messageService.sendDecrypted(decryptedData);
      return true;

    } catch (except) {
      console.log('wrong pass');
    }
  }

  getstatusencryption(): Observable<any> {
    return this.decryptstatusObs.asObservable();
  }

  updateEncStatus(message: any) {
    this.decryptstatusObs.next(message);
  }

  getchangesStatus(): Observable<any> {
    return this.changesStatus.asObservable();
  }

  updatechangesStatus(message: any) {
    this.changesStatus.next(message);
  }


  getkeybyReportID(reportid) {
    return new Promise<any>((resolve, reject) => {

      const indexedDB = window.indexedDB;
      const open = indexedDB.open('vulnrepo-db', 1);

      open.onupgradeneeded = function () {
        const db = open.result;
        db.createObjectStore('reports', { autoIncrement: true });
      };

      open.onsuccess = function () {
        const db = open.result;
        const tx = db.transaction('reports', 'readwrite');
        const store = tx.objectStore('reports');

        // add, clear, count, delete, get, getAll, getAllKeys, getKey, put
        const request = store.openCursor();

        request.onsuccess = function (evt) {

          const cursor = request.result;
          if (cursor) {
            const key = cursor.primaryKey;
            const value = cursor.value.report_id;

            if (reportid === value) {
              const finded = { key, value };
              resolve(finded);
            }
            cursor.continue();
          } else {
            // no more results

          }

        };

        tx.oncomplete = function () {
          db.close();
          resolve({ 'NotFound': 'NOOK' });
        };
        request.onerror = function (e) {
          reject(e);
        };
      };

    });
  }


  deletesingleReporthistory(item: any) {
    return new Promise<any>((resolve, reject) => {
      this.getSinglekeybyReporthistoryID(item).then(data => {
        if (data) {

          // indexeddb communication
          const indexedDB = window.indexedDB;
          const open = indexedDB.open('vulnrepo-db-history', 1);

          open.onupgradeneeded = function () {
            const db = open.result;
            db.createObjectStore('reports-history', { autoIncrement: true });
          };

          open.onsuccess = function () {
            const db = open.result;
            const tx = db.transaction('reports-history', 'readwrite');
            const store = tx.objectStore('reports-history');

            store.delete(data.key);

            tx.oncomplete = function () {
              db.close();
              resolve(true);
            };
          };

        }
      });
    });
  }

  getSinglekeybyReporthistoryID(report) {
    return new Promise<any>((resolve, reject) => {

      const indexedDB = window.indexedDB;
      const open = indexedDB.open('vulnrepo-db-history', 1);

      open.onupgradeneeded = function () {
        const db = open.result;
        db.createObjectStore('reports-history', { autoIncrement: true });
      };

      open.onsuccess = function () {
        const db = open.result;
        const tx = db.transaction('reports-history', 'readwrite');
        const store = tx.objectStore('reports-history');

        // add, clear, count, delete, get, getAll, getAllKeys, getKey, put
        const request = store.openCursor();

        request.onsuccess = function (evt) {

          const cursor = request.result;
          if (cursor) {
            const key = cursor.primaryKey;
            const value = cursor.value.report_id;

            if (report.report_id === value) {

              if (JSON.stringify(report) === JSON.stringify(cursor.value)) {

                const finded = { key, value };
                resolve(finded);
              }


            }
            cursor.continue();
          } else {
            // no more results

          }

        };

        tx.oncomplete = function () {
          db.close();
          resolve({ 'NotFound': 'NOOK' });
        };
        request.onerror = function (e) {
          reject(e);
        };
      };

    });
  }

  getkeybyReporthistoryID(reportid) {
    return new Promise<any>((resolve, reject) => {

      const indexedDB = window.indexedDB;
      const open = indexedDB.open('vulnrepo-db-history', 1);

      open.onupgradeneeded = function () {
        const db = open.result;
        db.createObjectStore('reports-history', { autoIncrement: true });
      };

      open.onsuccess = function () {
        const db = open.result;
        const tx = db.transaction('reports-history', 'readwrite');
        const store = tx.objectStore('reports-history');

        // add, clear, count, delete, get, getAll, getAllKeys, getKey, put
        const request = store.openCursor();
        const arr: any = [];

        request.onsuccess = function (evt) {

          const cursor = request.result;
          if (cursor) {
            const key = cursor.primaryKey;
            const value = cursor.value.report_id;

            if (reportid === value) {
              const finded = { key, value };
              arr.push(finded);
            }
            cursor.continue();
          } else {
            // no more results
            resolve(arr);
          }

        };

        tx.oncomplete = function () {
          db.close();
          resolve({ 'NotFound': 'NOOK' });
        };
        request.onerror = function (e) {
          reject(e);
        };
      };

    });
  }

  deleteReporthistory(item: any) {
    return new Promise<any>((resolve, reject) => {
      this.getkeybyReporthistoryID(item.report_id).then(data => {
        if (data) {

          data.forEach(function (item) {

            // indexeddb communication
            const indexedDB = window.indexedDB;
            const open = indexedDB.open('vulnrepo-db-history', 1);

            open.onupgradeneeded = function () {
              const db = open.result;
              db.createObjectStore('reports-history', { autoIncrement: true });
            };

            open.onsuccess = function () {
              const db = open.result;
              const tx = db.transaction('reports-history', 'readwrite');
              const store = tx.objectStore('reports-history');

              store.delete(item.key);

              tx.oncomplete = function () {
                db.close();
              };
            };

          });

        }
      });
    });
  }

  removeReporthistory(report_id: string) {
    return new Promise<any>((resolve, reject) => {

      this.getReportsHistory(report_id).then(retdata => {
        if (retdata.length > 0) {

          retdata.forEach(function (item) {

            this.deleteReporthistory(item).then(data => { });
          }, this);

        }
      });

    });
  }


  add_report_to_history(value) {
    return new Promise<any>((resolve, reject) => {

      const indexedDB = window.indexedDB;
      const open = indexedDB.open('vulnrepo-db-history', 1);

      open.onupgradeneeded = function () {
        const db = open.result;
        db.createObjectStore('reports-history', { autoIncrement: true });
      };

      open.onsuccess = function () {
        const db = open.result;
        const tx = db.transaction('reports-history', 'readwrite');
        const store = tx.objectStore('reports-history');

        store.put(value);

        tx.oncomplete = function () {
          db.close();
        };
      };

    });
  }

  getReportsHistory(reportid) {
    return new Promise<any>((resolve, reject) => {

      const indexedDB = window.indexedDB;
      const open = indexedDB.open('vulnrepo-db-history', 1);

      open.onupgradeneeded = function () {
        const db = open.result;
        db.createObjectStore('reports-history', { autoIncrement: true });
      };

      open.onsuccess = function () {
        const db = open.result;
        const tx = db.transaction('reports-history', 'readwrite');
        const store = tx.objectStore('reports-history');

        // add, clear, count, delete, get, getAll, getAllKeys, getKey, put
        const request = store.getAll();

        request.onsuccess = function (evt) {

          const historical_versions = request.result.filter(function (el) {
            return (el.report_id === reportid);
          });

          resolve(historical_versions);
        };

        tx.oncomplete = function () {
          db.close();
        };
        request.onerror = function (e) {
          reject(e);
        };
      };

    });
  }

  updatereportDB(key, value) {
    return new Promise<any>((resolve, reject) => {

      const indexedDB = window.indexedDB;
      const open = indexedDB.open('vulnrepo-db', 1);

      open.onupgradeneeded = function () {
        const db = open.result;
        db.createObjectStore('reports', { autoIncrement: true });
      };

      open.onsuccess = function () {
        const db = open.result;
        const tx = db.transaction('reports', 'readwrite');
        const store = tx.objectStore('reports');

        // add, clear, count, delete, get, getAll, getAllKeys, getKey, put
        const request = store.put(value, key);

        request.onsuccess = function (evt) {
          resolve('encrypted:ok');
        };

        tx.oncomplete = function () {
          db.close();
        };
        request.onerror = function (e) {
          reject(e);
        };
      };

    });
  }

  prepareupdatereport(data: any, pass: string, reportid: any, reportname: any, reportcreatedate: any, reportorder: any) {
    return new Promise<any>((resolve, reject) => {
      try {
        // Encrypt
        const ciphertext = Crypto.AES.encrypt(JSON.stringify(data), pass);
        const now: number = Date.now();
        const to_update = {
          report_id: reportid,
          report_name: reportname,
          report_createdate: reportcreatedate,
          report_lastupdate: now,
          encrypted_data: ciphertext.toString()
        };



        //add to history
        this.add_report_to_history(to_update).then(data => { });


        this.updatereportDB(reportorder, to_update).then(retu => {
          if (retu === 'encrypted:ok') {
            //execute navbar refresh
            this.sessionsub.removeSessionStorageItem('encrypted:ok');
            resolve(now);
          }
        });

      } catch (except) {
        console.log(except);
      }

    });

  }


  prepareupdateAPIreport(apiurl: string, apikey: string, data: any, pass: string, reportid: any, reportname: any, reportcreatedate: any) {
    return new Promise<any>((resolve, reject) => {
      try {
        // Encrypt
        const ciphertext = Crypto.AES.encrypt(JSON.stringify(data), pass);
        const now: number = Date.now();
        const to_update = {
          report_id: reportid,
          report_name: reportname,
          report_createdate: reportcreatedate,
          report_lastupdate: now,
          encrypted_data: ciphertext.toString()
        };

        const localkey = this.sessionsub.getSessionStorageItem('VULNREPO-API');
        if (localkey) {
          // tslint:disable-next-line:max-line-length
          this.apiService.APISend(apiurl, apikey, 'updatereport', 'reportdata=' + btoa(JSON.stringify(to_update))).then(resp => {
            if (resp.STORAGE === 'NOSPACE') {
              this.snackBar.open('API ERROR: NO SPACE LEFT!', 'OK', {
                duration: 3000,
                panelClass: ['notify-snackbar-fail']
              });
              resolve('NOSPACE');
            } else if (resp.REPORT_UPDATE === 'OK') {
              //execute navbar refresh
              this.sessionsub.removeSessionStorageItem('encrypted:ok');
              resolve(now);
            }
          });
        }

      } catch (except) {
        console.log(except);
      }

    });

  }


  downloadEncryptedReport(report_id) {

    this.checkifreportexist(report_id).then(data => {
      if (data) {
        this.preparedownload(data);
      } else {
        this.checkAPIreport(report_id).then(re => {
          this.preparedownload(re);
        });
      }

    });

  }

  preparedownload(data) {
    const enc = btoa(JSON.stringify(data));
    const blob = new Blob([encodeURIComponent(enc)], { type: 'text/plain' });
    const link = document.createElement('a');
    const url = window.URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', data.report_name + ' ' + data.report_id + ' (vulnrepo.com).vulnr');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  cloneReportadd(report: any) {
    return new Promise<any>((resolve, reject) => {
      // indexeddb communication
      const indexedDB = window.indexedDB;
      const open = indexedDB.open('vulnrepo-db', 1);

      open.onupgradeneeded = function () {
        const db = open.result;
        db.createObjectStore('reports', { autoIncrement: true });
      };

      open.onsuccess = function () {
        const db = open.result;
        const tx = db.transaction('reports', 'readwrite');
        const store = tx.objectStore('reports');

        store.put(report);

        tx.oncomplete = function () {
          db.close();
          resolve(true);
        };
      };

    });
  }

  encryptKEY(key, pass) {
    return new Promise<any>((resolve, reject) => {
      const ciphertext = Crypto.AES.encrypt(key, pass);
      resolve(ciphertext.toString());
    });
  }

  decryptKEY(key, pass) {
    return new Promise<any>((resolve, reject) => {
      const bytes = Crypto.AES.decrypt(key.toString(), pass);
      const decryptedData = bytes.toString(Crypto.enc.Utf8);
      resolve(decryptedData.toString());
    });
  }

  saveKEYinDB(key) {
    return new Promise<any>((resolve, reject) => {
      // indexeddb communication
      const indexedDB = window.indexedDB;
      const open = indexedDB.open('vulnrepo-api', 1);

      open.onupgradeneeded = function () {
        const db = open.result;
        db.createObjectStore('api');
      };

      open.onsuccess = function () {
        const db = open.result;
        const tx = db.transaction('api', 'readwrite');
        const store = tx.objectStore('api');

        store.put(key, 'vulnrepo-api-vault');

        tx.oncomplete = function () {
          db.close();
          resolve(true);
        };
      };

    });
  }

  retrieveAPIkey() {
    return new Promise<any>((resolve, reject) => {

      const indexedDB = window.indexedDB;
      const open = indexedDB.open('vulnrepo-api', 1);

      open.onupgradeneeded = function () {
        const db = open.result;
        db.createObjectStore('api', { autoIncrement: true });
      };

      open.onsuccess = function () {
        const db = open.result;
        const tx = db.transaction('api', 'readwrite');
        const store = tx.objectStore('api');

        // add, clear, count, delete, get, getAll, getAllKeys, getKey, put
        const request = store.get('vulnrepo-api-vault');

        request.onsuccess = function (evt) {
          resolve(request.result);
        };

        tx.oncomplete = function () {
          db.close();
        };
        request.onerror = function (e) {
          reject(e);
        };
      };

    });
  }

  checkAPIreport_single(reportid, url, key) {
    return new Promise<any>((resolve, reject) => {

      this.apiService.APISend(url, key, 'getreport', 'reportid=' + reportid).then(resp => {
        if (resp) {
          if (resp.length > 0) {
            console.log('Report exist in API: OK');
            resolve(resp[0]);
          }
        } else {
          resolve(false);
        }

      });

    });
  }

  checkAPIreport(reportid) {
    return new Promise<any>((resolve, reject) => {

      const localkey = this.sessionsub.getSessionStorageItem('VULNREPO-API');
      if (localkey) {

        const vaultobj = JSON.parse(localkey);
        vaultobj.forEach((element) => {
          this.apiService.APISend(element.value, element.apikey, 'getreport', 'reportid=' + reportid).then(resp => {
            if (resp) {
              if (resp.length > 0) {
                console.log('Report exist in API: OK');
                resolve(resp[0]);
              }
            }

          });

        });

      } else {
        resolve(false);

      }


    });
  }

  checkAPIreportchanges(reportid) {
    return new Promise<any>((resolve, reject) => {

      const localkey = this.sessionsub.getSessionStorageItem('VULNREPO-API');
      if (localkey) {

        const vaultobj = JSON.parse(localkey);

        vaultobj.forEach((element) => {
          this.apiService.APISend(element.value, element.apikey, 'getreport', 'reportid=' + reportid).then(resp => {
            if (resp) {
              if (resp.length > 0) {
                console.log('Report exist in API changes: OK');
                resolve(resp[0]);
              }
            }
          });

        });

      } else {
        resolve(false);
      }


    });
  }


  searchAPIreport(reportid) {
    return new Promise<any>((resolve, reject) => {

      const localkey = this.sessionsub.getSessionStorageItem('VULNREPO-API');
      if (localkey) {

        const vaultobj = JSON.parse(localkey);

        vaultobj.forEach((element) => {

          this.apiService.APISend(element.value, element.apikey, 'getreport', 'reportid=' + reportid).then(resp => {

            if (resp) {
              if (resp.length > 0) {
                console.log('Report exist in API: OK');
                resolve({ data: resp[0], api: element.value, apikey: element.apikey });
              }
            }

          }).then((resp) => {
            //if (check !== true) {
            //resolve('API_ERROR');
            //}
          });

        });

      }


    });
  }

  saveReportProfileinDB(key) {
    return new Promise<any>((resolve, reject) => {
      // indexeddb communication
      const indexedDB = window.indexedDB;
      const open = indexedDB.open('vulnrepo-profiles', 1);

      open.onupgradeneeded = function () {
        const db = open.result;
        db.createObjectStore('report-profiles', { autoIncrement: true });
      };

      open.onsuccess = function () {
        const db = open.result;
        const tx = db.transaction('report-profiles', 'readwrite');
        const store = tx.objectStore('report-profiles');

        store.put(key);

        tx.oncomplete = function () {
          db.close();
          resolve(true);
        };
      };

    });
  }

  retrieveReportProfile() {
    return new Promise<any>((resolve, reject) => {

      const indexedDB = window.indexedDB;
      const open = indexedDB.open('vulnrepo-profiles', 1);

      open.onupgradeneeded = function () {
        const db = open.result;
        db.createObjectStore('report-profiles', { autoIncrement: true });
      };

      open.onsuccess = function () {
        const db = open.result;
        const tx = db.transaction('report-profiles', 'readwrite');
        const store = tx.objectStore('report-profiles');

        // add, clear, count, delete, get, getAll, getAllKeys, getKey, put
        const request = store.openCursor();
        const arr: any = [];
        request.onsuccess = function (evt) {
          let cursor = request.result;
          if (cursor) {
            let key = cursor.primaryKey;
            let value = cursor.value;
            const ret = Object.assign({}, { "_key": key }, value);
            arr.push(ret)
            cursor.continue();
          }
          else {
            // no more results

          }

        };

        tx.oncomplete = function () {
          resolve(arr);
          db.close();
        };
        request.onerror = function (e) {
          reject(e);
        };
      };

    });
  }

  getkeybyProfileID(keyid) {
    return new Promise<any>((resolve, reject) => {

      const indexedDB = window.indexedDB;
      const open = indexedDB.open('vulnrepo-profiles', 1);

      open.onupgradeneeded = function () {
        const db = open.result;
        db.createObjectStore('report-profiles', { autoIncrement: true });
      };

      open.onsuccess = function () {
        const db = open.result;
        const tx = db.transaction('report-profiles', 'readwrite');
        const store = tx.objectStore('report-profiles');

        // add, clear, count, delete, get, getAll, getAllKeys, getKey, put
        const request = store.openCursor();

        request.onsuccess = function (evt) {

          const cursor = request.result;
          if (cursor) {
            const key = cursor.primaryKey;
            const value = cursor.value;

            if (key === keyid) {
              const finded = { key, value };
              resolve(finded);
            }
            cursor.continue();
          } else {
            // no more results

          }

        };

        tx.oncomplete = function () {
          db.close();
          resolve({ 'NotFound': 'NOOK' });
        };
        request.onerror = function (e) {
          reject(e);
        };
      };

    });
  }

  deleteProfile(item: any) {
    return new Promise<any>((resolve, reject) => {
      this.getkeybyProfileID(item._key).then(data => {
        if (data) {

          if (data.NotFound === 'NOOK') {
            console.log('no locally profile');
          } else {
            // indexeddb communication
            const indexedDB = window.indexedDB;
            const open = indexedDB.open('vulnrepo-profiles', 1);

            open.onupgradeneeded = function () {
              const db = open.result;
              db.createObjectStore('report-profiles', { autoIncrement: true });
            };

            open.onsuccess = function () {
              const db = open.result;
              const tx = db.transaction('report-profiles', 'readwrite');
              const store = tx.objectStore('report-profiles');

              store.delete(data.key);

              tx.oncomplete = function () {
                db.close();
                resolve(true);
              };
            };
          }

        }
      });
    });
  }

  updateProfile(newvalue, key) {
    return new Promise<any>((resolve, reject) => {

      const indexedDB = window.indexedDB;
      const open = indexedDB.open('vulnrepo-profiles', 1);

      open.onupgradeneeded = function () {
        const db = open.result;
        db.createObjectStore('report-profiles', { autoIncrement: true });
      };

      open.onsuccess = function () {
        const db = open.result;
        const tx = db.transaction('report-profiles', 'readwrite');
        const store = tx.objectStore('report-profiles');

        // add, clear, count, delete, get, getAll, getAllKeys, getKey, put
        const request = store.put(newvalue, key);

        request.onsuccess = function (evt) {
          resolve(true);
        };

        tx.oncomplete = function () {
          db.close();
        };
        request.onerror = function (e) {
          reject(e);
        };
      };

    });
  }

  saveReportTemplateinDB(item) {
    return new Promise<any>((resolve, reject) => {
      // indexeddb communication
      const indexedDB = window.indexedDB;
      const open = indexedDB.open('vulnrepo-templates', 1);

      open.onupgradeneeded = function () {
        const db = open.result;
        db.createObjectStore('report-templates', { autoIncrement: true });
      };

      open.onsuccess = function () {
        const db = open.result;
        const tx = db.transaction('report-templates', 'readwrite');
        const store = tx.objectStore('report-templates');

        store.put(item);

        tx.oncomplete = function () {
          db.close();
          resolve(true);
        };
      };

    });
  }

  retrieveReportTemplates() {
    return new Promise<any>((resolve, reject) => {

      const indexedDB = window.indexedDB;
      const open = indexedDB.open('vulnrepo-templates', 1);

      open.onupgradeneeded = function () {
        const db = open.result;
        db.createObjectStore('report-templates', { autoIncrement: true });
      };

      open.onsuccess = function () {
        const db = open.result;
        const tx = db.transaction('report-templates', 'readwrite');
        const store = tx.objectStore('report-templates');

        // add, clear, count, delete, get, getAll, getAllKeys, getKey, put
        const request = store.openCursor();
        const arr: any = [];
        request.onsuccess = function (evt) {
          let cursor = request.result;
          if (cursor) {
            let key = cursor.primaryKey;
            let value = cursor.value;
            const ret = Object.assign({}, { "_key": key }, value);
            arr.push(ret)
            cursor.continue();
          }
          else {
            // no more results

          }

        };

        tx.oncomplete = function () {
          resolve(arr);
          db.close();
        };
        request.onerror = function (e) {
          reject(e);
        };
      };

    });
  }

  getkeybyTemplateID(keyid) {
    return new Promise<any>((resolve, reject) => {

      const indexedDB = window.indexedDB;
      const open = indexedDB.open('vulnrepo-templates', 1);

      open.onupgradeneeded = function () {
        const db = open.result;
        db.createObjectStore('report-templates', { autoIncrement: true });
      };

      open.onsuccess = function () {
        const db = open.result;
        const tx = db.transaction('report-templates', 'readwrite');
        const store = tx.objectStore('report-templates');

        // add, clear, count, delete, get, getAll, getAllKeys, getKey, put
        const request = store.openCursor();

        request.onsuccess = function (evt) {

          const cursor = request.result;
          if (cursor) {
            const key = cursor.primaryKey;
            const value = cursor.value.title;

            if (key === keyid) {
              const finded = { key, value };
              resolve(finded);
            }
            cursor.continue();
          } else {
            // no more results

          }

        };

        tx.oncomplete = function () {
          db.close();
          resolve({ 'NotFound': 'NOOK' });
        };
        request.onerror = function (e) {
          reject(e);
        };
      };

    });
  }

  deleteTemplate(item: any) {
    return new Promise<any>((resolve, reject) => {
      this.getkeybyTemplateID(item._key).then(data => {
        if (data) {

          if (data.NotFound === 'NOOK') {
            console.log('no locally template');
          } else {
            // indexeddb communication
            const indexedDB = window.indexedDB;
            const open = indexedDB.open('vulnrepo-templates', 1);

            open.onupgradeneeded = function () {
              const db = open.result;
              db.createObjectStore('report-templates', { autoIncrement: true });
            };

            open.onsuccess = function () {
              const db = open.result;
              const tx = db.transaction('report-templates', 'readwrite');
              const store = tx.objectStore('report-templates');

              store.delete(data.key);

              tx.oncomplete = function () {
                db.close();
                resolve(true);
              };
            };
          }

        }
      });
    });
  }


  updateTemplate(newvalue, key) {
    return new Promise<any>((resolve, reject) => {

      const indexedDB = window.indexedDB;
      const open = indexedDB.open('vulnrepo-templates', 1);

      open.onupgradeneeded = function () {
        const db = open.result;
        db.createObjectStore('report-templates', { autoIncrement: true });
      };

      open.onsuccess = function () {
        const db = open.result;
        const tx = db.transaction('report-templates', 'readwrite');
        const store = tx.objectStore('report-templates');

        // add, clear, count, delete, get, getAll, getAllKeys, getKey, put
        const request = store.put(newvalue, key);

        request.onsuccess = function (evt) {
          resolve(true);
        };

        tx.oncomplete = function () {
          db.close();
        };
        request.onerror = function (e) {
          reject(e);
        };
      };

    });
  }

  updateAiintegration(newvalue, key) {
    return new Promise<any>((resolve, reject) => {

      const indexedDB = window.indexedDB;
      const open = indexedDB.open('vulnrepo-ollama', 1);

      open.onupgradeneeded = function () {
        const db = open.result;
        db.createObjectStore('report-ollama', { autoIncrement: false });
      };

      open.onsuccess = function () {
        const db = open.result;
        const tx = db.transaction('report-ollama', 'readwrite');
        const store = tx.objectStore('report-ollama');

        // add, clear, count, delete, get, getAll, getAllKeys, getKey, put
        const request = store.put(newvalue, key);

        request.onsuccess = function (evt) {
          resolve(true);
        };

        tx.oncomplete = function () {
          db.close();
        };
        request.onerror = function (e) {
          reject(e);
        };
      };

    });
  }


  getkeybyAiintegration() {
    return new Promise<any>((resolve, reject) => {

      const indexedDB = window.indexedDB;
      const open = indexedDB.open('vulnrepo-ollama', 1);

      open.onupgradeneeded = function () {
        const db = open.result;
        db.createObjectStore('report-ollama', { autoIncrement: false });
      };

      open.onsuccess = function () {
        const db = open.result;
        const tx = db.transaction('report-ollama', 'readwrite');
        const store = tx.objectStore('report-ollama');

        // add, clear, count, delete, get, getAll, getAllKeys, getKey, put
        const request = store.getAll();

        request.onsuccess = function (evt) {
          resolve(request.result);
        };

        tx.oncomplete = function () {
          db.close();
        };
        request.onerror = function (e) {
          reject(e);
        };
      };

    });
  }

  // DOCX Template management methods
  
  /**
   * Initialize DOCX templates database
   */
  private initDocxTemplatesDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const open = indexedDB.open('vulnrepo-docx-templates', 1);

      open.onupgradeneeded = function () {
        const db = open.result;
        db.createObjectStore('docx-templates', { keyPath: 'id' });
      };

      open.onsuccess = function () {
        resolve(open.result);
      };

      open.onerror = function () {
        reject(open.error);
      };
    });
  }

  /**
   * Save a DOCX template to IndexedDB
   */
  saveDocxTemplate(template: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await this.initDocxTemplatesDB();
        const transaction = db.transaction(['docx-templates'], 'readwrite');
        const objectStore = transaction.objectStore('docx-templates');
        const request = objectStore.put(template);

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          reject(request.error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get all DOCX templates from IndexedDB
   */
  getDocxTemplates(): Promise<any[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await this.initDocxTemplatesDB();
        const transaction = db.transaction(['docx-templates'], 'readonly');
        const objectStore = transaction.objectStore('docx-templates');
        const request = objectStore.getAll();

        request.onsuccess = () => {
          resolve(request.result || []);
        };

        request.onerror = () => {
          reject(request.error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get a specific DOCX template by ID
   */
  getDocxTemplate(id: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await this.initDocxTemplatesDB();
        const transaction = db.transaction(['docx-templates'], 'readonly');
        const objectStore = transaction.objectStore('docx-templates');
        const request = objectStore.get(id);

        request.onsuccess = () => {
          resolve(request.result || null);
        };

        request.onerror = () => {
          reject(request.error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Delete a DOCX template from IndexedDB
   */
  deleteDocxTemplate(id: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const db = await this.initDocxTemplatesDB();
        const transaction = db.transaction(['docx-templates'], 'readwrite');
        const objectStore = transaction.objectStore('docx-templates');
        const request = objectStore.delete(id);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          reject(request.error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }



}
