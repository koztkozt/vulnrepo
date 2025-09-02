import { Component, OnInit, OnDestroy, ViewChild, KeyValueChanges, KeyValueDiffer, KeyValueDiffers, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { IndexeddbService } from '../indexeddb.service';
import { DialogPassComponent } from '../dialog-pass/dialog-pass.component';
import { DialogAddissueComponent } from '../dialog-addissue/dialog-addissue.component';
import { Router } from '@angular/router';
import { Subscription, of, concatMap, Observable } from 'rxjs';
import { MessageService } from '../message.service';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { DialogImportComponent } from '../dialog-import/dialog-import.component';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { DialogEditComponent } from '../dialog-edit/dialog-edit.component';
import { DialogExportissuesComponent } from '../dialog-exportissues/dialog-exportissues.component';
import { DialogChangelogComponent } from '../dialog-changelog/dialog-changelog.component';
import { DialogChangekeyComponent } from '../dialog-changekey/dialog-changekey.component';
import { DialogRemoveitemsComponent } from '../dialog-removeitems/dialog-removeitems.component';
import { DialogIssuesEditComponent } from '../dialog-issues-edit/dialog-issues-edit.component';
import { DialogCvssComponent } from '../dialog-cvss/dialog-cvss.component';
import { DialogCveComponent } from '../dialog-cve/dialog-cve.component';
import { DialogCustomcontentComponent } from '../dialog-customcontent/dialog-customcontent.component';
import { DialogReportcssComponent } from '../dialog-reportcss/dialog-reportcss.component';
import { DialogApierrorComponent } from '../dialog-apierror/dialog-apierror.component';
import { sha256 } from 'js-sha256';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipInputEvent } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { HttpClient, HttpEventType } from '@angular/common/http';
import * as Crypto from 'crypto-js';
import { v4 as uuid } from 'uuid';
import DOMPurify from 'dompurify';
import { ApiService } from '../api.service';
import { MatCalendar, MatCalendarCellCssClasses, DateRange } from '@angular/material/datepicker';
import { SessionstorageserviceService } from "../sessionstorageservice.service"
import { DatePipe } from '@angular/common';
import { DateAdapter } from '@angular/material/core';
import { DialogAddCustomTemplateComponent } from '../dialog-add-custom-template/dialog-add-custom-template.component';
import { DialogEncryptReportComponent } from '../dialog-encrypt-report/dialog-encrypt-report.component';
import { PageEvent } from '@angular/material/paginator';
import { DialogEditorFullscreenComponent } from '../dialog-editor-fullscreen/dialog-editor-fullscreen.component';
import { DialogAttachPreviewComponent } from '../dialog-attach-preview/dialog-attach-preview.component';
import { AlignmentType, Document, Footer, Header, Packer, PageBreak, HeadingLevel, ImageRun, PageNumber, NumberFormat, Paragraph, TextRun, TableOfContents, Table, TableCell, TableRow, WidthType } from "docx";
import { TemplateHandler, MimeType } from 'easy-template-x';
import { TemplateService } from '../template.service';
import { UtilsService } from '../utils.service';
import { OllamaServiceService } from '../ollama-service.service';
import { DialogOllamaSettingsComponent } from '../dialog-ollama-settings/dialog-ollama-settings.component';
import { DialogOllamaComponent } from '../dialog-ollama/dialog-ollama.component';
import { CurrentdateService } from '../currentdate.service';
import { DialogMergeIssuesComponent } from '../dialog-merge-issues/dialog-merge-issues.component';
import { DialogReportHistoryComponent } from '../dialog-report-history/dialog-report-history.component';
import { DialogSpinnerComponent } from '../dialog-spinner/dialog-spinner.component';

export interface Tags {
  name: string;
}

@Component({
  standalone: false,
  //imports: [],
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss']
})

export class ReportComponent implements OnInit, OnDestroy, AfterViewInit {

  // Pie
  public pieChartLabels: string[] = ['Critical', 'High', 'Medium', 'Low', 'Info'];
  public chartcolors: any[] = [{
    backgroundColor: ['#FF0039', '#FF7518', '#F9EE06', '#3FB618', '#2780E3']
  }];

  private reportDiffer: KeyValueDiffer<string, any>;
  private reportDifferlogo: KeyValueDiffer<string, any>;
  private reportDiffersettings: KeyValueDiffer<string, any>;
  private reportTitleDiffer: KeyValueDiffer<any, any>;
  private objDiffers: Array<KeyValueDiffer<string, any>>;
  private objDiffersFiles: Array<KeyValueDiffer<string, any>>;
  private objDiffersResearcher: Array<KeyValueDiffer<string, any>>;
  public pieChartData: number[] = [0, 0, 0, 0, 0];
  public pieChartType = 'pie';
  public pieChartPlugins = [];

  dialogRef: MatDialogRef<DialogPassComponent>;
  displayedColumns: string[] = ['date', 'desc', 'settings'];
  dataSource = new MatTableDataSource();
  listchangelog: any[];

  @ViewChild("textareaheight") textareaheight: ElementRef;
  @ViewChild('paginatorIssues') paginator: MatPaginator;
  @ViewChild('paginatorchangelog') paginator2: MatPaginator;

  @ViewChild('table2', { read: MatSort }) sort: MatSort;

  issesTable = new MatTableDataSource();
  selectedResult: any;
  length: number;
  pageSize = 20;
  pageIndex = 0;
  pageEvent: PageEvent;

  @ViewChild(MatCalendar) calendar: MatCalendar<Date>;
  advhtml = '';
  report_css: any;
  bugbountylist = [];
  reportProfileList_int: string[] = [];
  report_id: string;
  report_info: any;
  lastsavereportdata = '';
  reportdesc: any;
  selecteditem = false;
  BBmsg = '';

  textarea_selected = ""
  textarea_selected_start: any;
  textarea_selected_end: any;
  textarea_click: any;
  selectedIssues: any[] = [];
  ReportProfilesList: any[] = [];
  scopePreviewHTML = [];
  RaportsTags: any[] = [];
  pok = 0;
  prev_height = 190;
  timerCounter = 0;
  spinner:any;
  savemsg = '';
  report_decryption_in_progress: boolean;
  report_encryption_in_progress: boolean;
  api_connection_status: boolean;
  report_source_api = false;
  upload_in_progress = false;
  youhaveunsavedchanges = false;
  decryptedReportData: any;
  decryptedReportDataChanged: any;
  setLocal = 'en-GB';  //dd/MM/yyyy
  subscription: Subscription;
  displayedSeverityColumns: string[] = ['severity', 'count'];
  dataSourceforseverity = [
    { severity: 'Critical', count: 0 },
    { severity: 'High', count: 0 },
    { severity: 'Medium', count: 0 },
    { severity: 'Low', count: 0 },
    { severity: 'Info', count: 0 }
  ];
  issueStatus = [
    { status: 'Open (Waiting for review)', value: 1 },
    { status: 'Fix In Progress', value: 2 },
    { status: 'Fixed', value: 3 },
    { status: 'Won\'t Fix', value: 4 }
  ];
  selectedtheme = 'white';
  uploadlogoprev = '';
  adv_html: any;
  advlogo: any;
  advlogo_saved: any;

  severitytable = [
    { name: 'Critical', value: 0 },
    { name: 'High', value: 0 },
    { name: 'Medium', value: 0 },
    { name: 'Low', value: 0 },
    { name: 'Info', value: 0 }
  ];

  // options stats
  gradient: boolean = true;
  showLegend: boolean = true;
  showLabels: boolean = true;
  isDoughnut: boolean = false;

  colorScheme = {
    domain: ['#FF0039', '#FF7518', '#F9EE06', '#3FB618', '#2780E3']
  };

  // options stats activity
  selectedRangeValue: DateRange<Date> | null;
  startDate: any;
  visible = true;
  selectable = true;
  removable = true;
  addOnBlur = true;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;

  aiprogress = false;
  aiconnected = false;
  models: any;

  @HostListener('window:keydown.control.shift.l', ['$event'])
  GoToNewReport(event: KeyboardEvent) {
    event.preventDefault();
    this.addissue();
  }

  constructor(private route: ActivatedRoute,
    public dialog: MatDialog,
    private ollamaService: OllamaServiceService,
    private http: HttpClient,
    private indexeddbService: IndexeddbService,
    private differs: KeyValueDiffers,
    public router: Router,
    private apiService: ApiService,
    private messageService: MessageService,
    private snackBar: MatSnackBar,
    public sessionsub: SessionstorageserviceService,
    private datePipe: DatePipe,
    private dateAdapter: DateAdapter<Date>,
    private utilsService: UtilsService,
    private currentdateService: CurrentdateService,
    private templateService: TemplateService) {
    //console.log(route);
    this.subscription = this.messageService.getDecrypted().subscribe(message => {
      this.decryptedReportData = message;
      this.decryptedReportDataChanged = this.decryptedReportData;
      this.adv_html = this.decryptedReportDataChanged.report_settings.report_html;
      this.advlogo_saved = this.decryptedReportDataChanged.report_settings.report_logo.logo;

      this.reportDiffer = this.differs.find(this.decryptedReportData).create();
      this.reportDifferlogo = this.differs.find({ report_logo: this.decryptedReportDataChanged.report_settings.report_logo.logo }).create();
      this.reportDiffersettings = this.differs.find(this.decryptedReportDataChanged.report_settings).create();

      this.objDiffers = new Array<KeyValueDiffer<string, any>>();
      this.decryptedReportDataChanged.report_vulns.forEach((itemGroup, index) => {
        this.objDiffers[index] = this.differs.find(itemGroup).create();
      });

      this.objDiffersFiles = new Array<KeyValueDiffer<string, any>>();
      this.decryptedReportDataChanged.report_vulns.forEach((itemGroup, index) => {
        this.objDiffersFiles[index] = this.differs.find(itemGroup.files).create();
      });

      this.objDiffersResearcher = new Array<KeyValueDiffer<string, any>>();
      this.decryptedReportDataChanged.researcher.forEach((itemGroup, index) => {
        this.objDiffersResearcher[index] = this.differs.find(itemGroup).create();
      });

      if (this.report_info) {
        this.reportTitleDiffer = this.differs.find({ report_name: this.report_info.report_name }).create();
      }

      this.doStats();

      this.calendarDateChanged();
      this.startDate = new Date(this.decryptedReportDataChanged.report_metadata.starttest);

      // get css style
      this.http.get('/assets/bootstrap.min.css', { responseType: 'text' }).subscribe(res => {
        this.report_css = res;
      });

      // get bug bountys programs list, full credits: https://github.com/projectdiscovery/public-bugbounty-programs
      this.http.get<any>('/assets/chaos-bugbounty-list.json?v=' + + new Date()).subscribe(res => {
        this.bugbountylist = res.programs;
      });

      this.getReportProfiles();


      this.issesTable = new MatTableDataSource(this.decryptedReportDataChanged.report_vulns);
      this.issesTable.paginator = this.paginator;
      this.selectedResult = this.decryptedReportDataChanged.report_vulns.slice(0, this.pageSize);

      setTimeout(() => this.issesTable.paginator = this.paginator);
      setTimeout(() => this.dataSource.sort = this.sort);
      setTimeout(() => this.dataSource.paginator = this.paginator2);

    });

  }

  ngOnInit() {
    // this.report_id = this.route.snapshot.params['report_id'];
    //set local
    if (navigator.language) {
      this.dateAdapter.setLocale(navigator.language); //detect browser local
      this.setLocal = navigator.language;
    } else {
      this.dateAdapter.setLocale(this.setLocal);
    }


    this.route.params.subscribe(routeParams => {
      if (routeParams.report_id != '') {
        if (routeParams.report_id) {
          this.report_decryption_in_progress = true;
          this.report_id = routeParams.report_id;
          this.youhaveunsavedchanges = false;
          this.lastsavereportdata = '';
          this.savemsg = '';
          // check if report exist
          this.indexeddbService.checkifreportexist(this.report_id).then(data => {
            if (data) {

              console.log('Report exist: OK');
              this.report_info = data;
              this.reportdesc = data;
              // check if pass in sessionStorage
              const pass = this.sessionsub.getSessionStorageItem(data.report_id);
              if (pass !== null) {
                this.report_decryption_in_progress = true;
                this.indexeddbService.decrypt(pass, data.report_id).then(returned => {

                  if (returned) {
                    this.report_decryption_in_progress = false;
                    this.report_source_api = false;
                  }

                });
              } else {
                this.report_decryption_in_progress = false;
                setTimeout(_ => this.openDialog(data)); // BUGFIX: https://github.com/angular/angular/issues/6005#issuecomment-165911194
              }

            } else {
              console.log('Report not exist locally: YES');
              this.api_connection_status = true;
              this.report_decryption_in_progress = false;
              this.indexeddbService.checkAPIreport(this.report_id).then(re => {
                if (re) {
                  this.report_info = re;
                  this.reportdesc = re;
                  this.api_connection_status = false;
                  // check if pass in sessionStorage
                  const pass = this.sessionsub.getSessionStorageItem(re.report_id);
                  if (pass !== null) {
                    this.report_decryption_in_progress = true;
                    if (this.indexeddbService.decodeAES(re, pass)) {
                      this.report_decryption_in_progress = false;
                      this.report_source_api = true;
                    }
                  } else {
                    this.report_source_api = true;
                    setTimeout(_ => this.openDialog(re)); // BUGFIX: https://github.com/angular/angular/issues/6005#issuecomment-165911194
                  }
                } else {
                  this.api_connection_status = false;
                  this.router.navigate(['/my-reports']);
                }
              });
            }
          });

        }
      }
    });


    this.indexeddbService.getkeybyAiintegration().then(ret => {

      if (ret[0]) {
        this.aiconnected = true;
        this.models = ret[0];
      }
    });
  }


  ngAfterViewInit() { }

  calendarDateChanged() {
    this.selectedRangeValue = new DateRange<Date>(new Date(this.decryptedReportDataChanged.report_metadata.starttest), new Date(this.decryptedReportDataChanged.report_metadata.endtest));

    //jump to specific date
    if (this.decryptedReportDataChanged.report_metadata.starttest && this.calendar) {
      this.calendar.activeDate = new Date(this.decryptedReportDataChanged.report_metadata.starttest);
      this.calendar.updateTodaysDate(); // update calendar state
    }

  }

  onDateChangeReportstart(event) {
    const newdate = new Date(event.value).getTime();
    this.decryptedReportDataChanged.report_metadata.starttest = newdate;
    this.calendarDateChanged();
    this.sureYouWanttoLeave();
  }

  onDateChangeReportend(event) {
    const newdate = new Date(event.value).getTime();
    this.decryptedReportDataChanged.report_metadata.endtest = newdate;
    this.calendarDateChanged();
    this.sureYouWanttoLeave();
  }

  canDeactivate() {
    if (this.youhaveunsavedchanges == true) {
      return confirm("You have unsaved changes, Do you really want to leave?");
    }
    return true;
  }

  dateClass() {
    return (date: Date): MatCalendarCellCssClasses => {
      const issuearr_success: string[] = [];
      const issuearr_critical: string[] = [];
      const issuearr_high: string[] = [];
      const issuearr_medium: string[] = [];
      const issuearr_low: string[] = [];
      const issuearr_info: string[] = [];

      const critical = this.decryptedReportDataChanged.report_vulns.filter(function (el) {
        return (el.severity === 'Critical');
      });

      const high = this.decryptedReportDataChanged.report_vulns.filter(function (el) {
        return (el.severity === 'High');
      });

      const medium = this.decryptedReportDataChanged.report_vulns.filter(function (el) {
        return (el.severity === 'Medium');
      });

      const low = this.decryptedReportDataChanged.report_vulns.filter(function (el) {
        return (el.severity === 'Low');
      });

      const info = this.decryptedReportDataChanged.report_vulns.filter(function (el) {
        return (el.severity === 'Info');
      });

      critical.forEach((item, index) => {
        if (issuearr_critical.indexOf(item) === -1) {
          issuearr_critical.push(item.date);
        }
      });

      high.forEach((item, index) => {
        if (issuearr_high.indexOf(item) === -1) {
          issuearr_high.push(item.date);
        }
      });

      medium.forEach((item, index) => {
        if (issuearr_medium.indexOf(item) === -1) {
          issuearr_medium.push(item.date);
        }
      });

      low.forEach((item, index) => {
        if (issuearr_low.indexOf(item) === -1) {
          issuearr_low.push(item.date);
        }
      });

      info.forEach((item, index) => {
        if (issuearr_info.indexOf(item) === -1) {
          issuearr_info.push(item.date);
        }
      });

      // this.decryptedReportDataChanged.report_vulns.forEach((item, index) => {
      //   if (issuearr_success.indexOf(item) === -1) {
      //     issuearr_success.push(item.date);
      //   }
      // });

      const successdate = issuearr_success
        .map(strDate => new Date(strDate))
        .some(d => d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear());

      const specialdate = issuearr_critical
        .map(strDate => new Date(strDate))
        .some(d => d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear());

      const specialdatehigh = issuearr_high
        .map(strDate => new Date(strDate))
        .some(d => d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear());

      const specialdatemedium = issuearr_medium
        .map(strDate => new Date(strDate))
        .some(d => d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear());

      const specialdatelow = issuearr_low
        .map(strDate => new Date(strDate))
        .some(d => d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear());

      const specialdateinfo = issuearr_info
        .map(strDate => new Date(strDate))
        .some(d => d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear());

      if (specialdate) {
        return 'special-date'
      } else if (successdate) {
        return 'success-date'
      } else if (specialdatehigh) {
        return 'special-date-high'
      } else if (specialdatemedium) {
        return 'special-date-medium'
      } else if (specialdatelow) {
        return 'special-date-low'
      } else if (specialdateinfo) {
        return 'special-date-info'
      } else {
        return ''
      }

    };

  }

  getReportProfiles() {
    // get report profiles
    this.indexeddbService.retrieveReportProfile().then(ret => {
      if (ret) {
        this.ReportProfilesList = ret;
      }
      this.getAPIReportProfiles();
    });

  }

  getAPIReportProfiles() {
    const localkey = this.sessionsub.getSessionStorageItem('VULNREPO-API');
    if (localkey) {
      //this.msg = 'API connection please wait...';

      const vaultobj = JSON.parse(localkey);

      vaultobj.forEach((element) => {

        this.apiService.APISend(element.value, element.apikey, 'getreportprofiles', '').then(resp => {
          this.reportProfileList_int = [];
          if (resp.length > 0) {
            resp.forEach((ele) => {
              ele.api = 'remote';
              ele.apiurl = element.value;
              ele.apikey = element.apikey;
              ele.apiname = element.viewValue;
            });
            this.reportProfileList_int.push(...resp);
          }

        }).then(() => {

          this.ReportProfilesList = [...this.ReportProfilesList, ...this.reportProfileList_int];
          //this.dataSource.sort = this.sort;
          //this.dataSource.paginator = this.paginator;
          //this.msg = '';
        }).catch(() => { });


        setTimeout(() => {
          // console.log('hide progress timeout');
          //this.msg = '';
        }, 10000);

      });

    }
  }

  dataChanged(changes: KeyValueChanges<any, any[]>) {
    /* If you want to see details then use
      changes.forEachRemovedItem((record) => ...);
      changes.forEachAddedItem((record) => ...);
      changes.forEachChangedItem((record) => ...);
    */

    changes.forEachAddedItem((record) => {
      if (record.previousValue !== null) {
        this.afterDetection();
        //console.log('ADDED: ',record);
      }
    });

    changes.forEachChangedItem((record) => {
      // fix for rising detection change after report read only
      if (record.key !== 'report_version' && record.key !== 'report_name') {
        // console.log('Detection start');
        //console.log('CHANGED: ',record);
        this.afterDetection();
      }
    });

  }

  callListener(e) {
    e.preventDefault();
    e.returnValue = '';
  }
  timeout(e) {
    e.preventDefault();
    e.returnValue = '';
  }


  sureYouWanttoLeave() {
    window.addEventListener('beforeunload', this.callListener, true);
    this.youhaveunsavedchanges = true;

    this.indexeddbService.updatechangesStatus(true);
    
  }

  removeSureYouWanttoLeave() {
    window.removeEventListener('beforeunload', this.callListener, true);
    this.youhaveunsavedchanges = false;
    let id = window.setTimeout(function () { }, 0);
    while (id--) {
      window.clearTimeout(id); // will do nothing if no timeout with id is present
    }
    this.indexeddbService.updatechangesStatus(false);
  }

  afterDetectionNow() {
    this.reportDiffer = this.differs.find(this.decryptedReportData).create();
    this.reportDifferlogo = this.differs.find({ report_logo: this.decryptedReportDataChanged.report_settings.report_logo.logo }).create();
    this.reportDiffersettings = this.differs.find({ ...this.decryptedReportDataChanged.report_settings }).create();

    this.objDiffers = new Array<KeyValueDiffer<string, any>>();
    this.decryptedReportDataChanged.report_vulns.forEach((itemGroup, index) => {
      this.objDiffers[index] = this.differs.find(itemGroup).create();
    });

    this.objDiffersFiles = new Array<KeyValueDiffer<string, any>>();
    this.decryptedReportDataChanged.report_vulns.forEach((itemGroup, index) => {
      this.objDiffersFiles[index] = this.differs.find(itemGroup.files).create();
    });

    this.objDiffersResearcher = new Array<KeyValueDiffer<string, any>>();
    this.decryptedReportDataChanged.researcher.forEach((itemGroup, index) => {
      this.objDiffersResearcher[index] = this.differs.find(itemGroup).create();
    });

    if (this.report_info) {
      this.reportTitleDiffer = this.differs.find({ report_name: this.report_info.report_name }).create();
    }

    this.sureYouWanttoLeave();
  }

  afterDetection() {
    if (this.timerCounter >= 60) {
      setTimeout(() => { this.afterDetectionNow() }, 10000);
      this.timerCounter = 0;
    }
    this.timerCounter++;
    this.sureYouWanttoLeave();
  }

  ngDoCheck(): void {

    if (this.decryptedReportDataChanged) {

      const changes = this.reportDiffer.diff(this.decryptedReportDataChanged);
      if (changes) {
        this.dataChanged(changes);
      }

      if (this.reportDifferlogo) {
        const changeslogo = this.reportDifferlogo.diff({ report_logo: this.decryptedReportDataChanged.report_settings.report_logo.logo });
        if (changeslogo) {
          this.dataChanged(changeslogo);
        }
      }

      if (this.reportDiffersettings) {
        const changessettings = this.reportDiffersettings.diff(this.decryptedReportDataChanged.report_settings);
        if (changessettings) {
          this.dataChanged(changessettings);
        }
      }

      if (this.objDiffers) {
        this.decryptedReportDataChanged.report_vulns.forEach((itemGroup, index) => {
          if (this.objDiffers[index]) {
            const objDiffer = this.objDiffers[index];
            const objChanges = objDiffer.diff(itemGroup);
            if (objChanges) {
              this.dataChanged(objChanges);
            }
          }
        });
      }

      if (this.objDiffersFiles) {
        this.decryptedReportDataChanged.report_vulns.forEach((itemGroup, index) => {
          if (this.objDiffersFiles[index]) {
            const objDiffer2 = this.objDiffersFiles[index];
            const objChanges2 = objDiffer2.diff(itemGroup.files);
            if (objChanges2) {
              this.dataChanged(objChanges2);
            }
          }
        });
      }

      if (this.objDiffersResearcher) {
        this.decryptedReportDataChanged.researcher.forEach((itemGroup, index) => {
          if (this.objDiffersResearcher[index]) {
            const objDiffer3 = this.objDiffersResearcher[index];
            const objChanges3 = objDiffer3.diff(itemGroup);
            if (objChanges3) {
              this.dataChanged(objChanges3);
            }
          }
        });
      }

    }

    if (this.reportTitleDiffer && this.report_info) {
      const changesName = this.reportTitleDiffer.diff({ report_name: this.report_info.report_name });
      if (changesName) {
        this.dataChanged(changesName);
      }
    }

  }

  toggle(event, checked) {

    const ret = this.selectedResult[event];
    const index: number = this.decryptedReportDataChanged.report_vulns.indexOf(ret);
    if (index !== -1) {
      if (checked === true) {
        this.selectedIssues.push({ "index": index, "data": ret });

      } else if (checked === false) {
        const index2: number = this.selectedIssues.findIndex(i => i.data === ret)
        if (index2 !== -1) {
          this.selectedIssues.splice(index2, 1);
        }
      }

    }


    if (this.selectedIssues.length > 0) {

      this.pok = 1;
    } else {
      this.pok = 0;
    }

  }

  checkcheckbox(i) {

    let returnVal = false;
    const ret = this.selectedResult[i];

    const index2: number = this.selectedIssues.findIndex(i => i.data === ret)
    if (index2 !== -1) {
      returnVal = true;
    }

    return returnVal
  }

  openissuesedit(array) {

    const dialogRef = this.dialog.open(DialogIssuesEditComponent, {
      width: '450px',
      data: { sel: array, orig: this.decryptedReportDataChanged.report_vulns }
    });

    dialogRef.afterClosed().subscribe(result => {

      if (result) {
        console.log('Dialog edit issue closed');
        this.doStats();
      }
    });

  }

  openissuesmerge(array) {

    const dialogRef = this.dialog.open(DialogMergeIssuesComponent, {
      width: '450px',
      data: array
    });

    dialogRef.afterClosed().subscribe(result => {

      if (result) {
        result.forEach(eachObj => {
          const index: number = this.decryptedReportDataChanged.report_vulns.indexOf(eachObj);
          if (index !== -1) {
            this.decryptedReportDataChanged.report_vulns.splice(index, 1);
            this.addtochangelog('Remove issue: ' + eachObj.title);
            this.afterDetectionNow();
          }
        });
        this.deselectall();
        this.doStats();
      }
    });

  }

  selectall() {

    this.pok = 1;
    this.selectedIssues = [];



    this.decryptedReportDataChanged.report_vulns.forEach((element, ind) => {

      this.selectedIssues.push({ "index": ind, "data": element });

    });


  }

  deselectall() {


    this.pok = 0;
    this.selectedIssues = [];

  }

  removeSelecteditems(array) {

    const dialogRef = this.dialog.open(DialogRemoveitemsComponent, {
      width: '400px',
      data: { sel: array, orig: this.decryptedReportDataChanged.report_vulns }
    });

    dialogRef.afterClosed().subscribe(result => {

      if (result) {
        result.forEach(eachObj => {
          const index: number = this.decryptedReportDataChanged.report_vulns.indexOf(eachObj);
          if (index !== -1) {
            this.decryptedReportDataChanged.report_vulns.splice(index, 1);
            this.addtochangelog('Remove issue: ' + eachObj.title);
            this.afterDetectionNow();
          }
        });
        this.deselectall();
        this.doStats();
      }
    });

  }


  openDialogCVSS(data: any): void {

    const dialogRef = this.dialog.open(DialogCvssComponent, {
      width: '800px',
      disableClose: false,
      data: data
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The CVSS dialog was closed');
      this.doStats();
    });

  }


  openDialogCVE(data: any): void {

    const dialogRef = this.dialog.open(DialogCveComponent, {
      width: '700px',
      disableClose: false,
      data: data
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The CVE dialog was closed');
    });

  }


  openDialog(data: any): void {

    const dialogRef = this.dialog.open(DialogPassComponent, {
      width: '400px',
      disableClose: true,
      data: data
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The security key dialog was closed');
    });

  }

  addtablescope(): void {

    this.decryptedReportDataChanged.report_scope = this.decryptedReportDataChanged.report_scope + ' \
\n\
IP   | hostname | role | comments\n\
------|--------------|-------|---------------\n\
127.0.0.1 | localhost.localdomain | PROD | client asked to test this one with care\n\
255.255.255.255 | N/A | DMZ | test you can go do whatever you want on it\n\
';

  }

  addcodescope(): void {

    this.decryptedReportDataChanged.report_scope = this.decryptedReportDataChanged.report_scope + ' \
\n\
```\n\
Sample code here\n\
```\n\
';

  }

  doStats() {

    const critical = this.decryptedReportDataChanged.report_vulns.filter(function (el) {
      return (el.severity === 'Critical');
    });

    const high = this.decryptedReportDataChanged.report_vulns.filter(function (el) {
      return (el.severity === 'High');
    });

    const medium = this.decryptedReportDataChanged.report_vulns.filter(function (el) {
      return (el.severity === 'Medium');
    });

    const low = this.decryptedReportDataChanged.report_vulns.filter(function (el) {
      return (el.severity === 'Low');
    });

    const info = this.decryptedReportDataChanged.report_vulns.filter(function (el) {
      return (el.severity === 'Info');
    });

    this.dataSourceforseverity = [
      { severity: 'Critical', count: critical.length },
      { severity: 'High', count: high.length },
      { severity: 'Medium', count: medium.length },
      { severity: 'Low', count: low.length },
      { severity: 'Info', count: info.length }
    ];

    this.severitytable = [
      { name: 'Critical', value: critical.length },
      { name: 'High', value: high.length },
      { name: 'Medium', value: medium.length },
      { name: 'Low', value: low.length },
      { name: 'Info', value: info.length }
    ];



    this.listchangelog = this.decryptedReportData.report_changelog;
    this.dataSource = new MatTableDataSource(this.decryptedReportData.report_changelog);
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator2;

    if (this.decryptedReportDataChanged.report_vulns.length > 0) {
      setTimeout(() => {
        if (this.calendar) {
          this.calendar.updateTodaysDate();
        }
      });
    }

    // this.reportdesc.report_lastupdate = this.decryptedReportDataChanged.report_lastupdate;
    this.issesTable = new MatTableDataSource(this.decryptedReportDataChanged.report_vulns);
    this.issesTable.paginator = this.paginator;
    this.selectedResult = this.decryptedReportDataChanged.report_vulns.slice(this.pageIndex * this.pageSize, this.pageIndex * this.pageSize + this.pageSize);

  }

  getData(event?: PageEvent) {

    if (event) {
      this.pageSize = event.pageSize;
      this.pageIndex = event.pageIndex;
    }

    this.selectedResult = this.decryptedReportDataChanged.report_vulns.slice(this.pageIndex * this.pageSize, this.pageIndex * this.pageSize + this.pageSize);
    return event;

  }

  renderdateformat(inputdate) {
    const date = new Date(inputdate).getTime();
    const rdate = this.datePipe.transform(date, 'yyyy-MM-dd');
    return rdate
  }

  onDateChange(data, event) {
    const newdate = new Date(event.value).getTime();
    const index: number = this.decryptedReportDataChanged.report_vulns.indexOf(data);
    if (index !== -1) {
      this.decryptedReportDataChanged.report_vulns[index].date = newdate;
      this.doStats();
    }

  }

  mergeissue(issue) {
    this.decryptedReportDataChanged.report_vulns.push(issue);
    this.addtochangelog('Create issue: ' + issue.title);
    this.afterDetectionNow();
    this.doStats();
  }

  addissue() {

    function isIterable(x: unknown): boolean {
      return !!x?.[Symbol.iterator];
    }

    console.log('Add issue');
    const dialogRef = this.dialog.open(DialogAddissueComponent, {
      width: '600px'
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      if (result !== undefined) {
        if (isIterable(result)) {
          for (var elem of result) {
            if (elem.title !== '') {
              this.mergeissue(elem);
            }
          }
        } else {
          this.mergeissue(result);
        }

      } else {

        if (result) {
          if (result.title !== '') {
            this.mergeissue(result);
          }
        }
      }

    });

  }

  import_issues() {
    console.log('Import issues');
    const dialogRef = this.dialog.open(DialogImportComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');

      if (result !== undefined) {
        result.forEach(eachObj => {

          if (eachObj.title !== '' && eachObj.title !== undefined && eachObj.cvss !== 'Active') {
            this.decryptedReportDataChanged.report_vulns.push(eachObj);
            this.addtochangelog('Create issue: ' + eachObj.title);
            this.afterDetectionNow();
          }

        });

        this.doStats();
      }

    });

  }


  export_by_tag(tag) {
    const filteredTags = this.decryptedReportDataChanged.report_vulns.filter((element) => element.tags.some((subElement) => subElement.name === tag));

    console.log('Export issues');
    const dialogRef = this.dialog.open(DialogExportissuesComponent, {
      width: '500px',
      data: filteredTags
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
    });


  }

  export_by_severity(exportitem, severity) {

    const bySeverity = exportitem.filter(item => item.severity === severity);

    if (bySeverity.length > 0) {
      console.log('Export issues');
      const dialogRef = this.dialog.open(DialogExportissuesComponent, {
        width: '500px',
        data: bySeverity
      });

      dialogRef.afterClosed().subscribe(result => {
        console.log('The dialog was closed');
      });
    }
  }

  export_issues(original, type) {
    console.log('Export issues');

    if (type === 'selected') {

      const dialogRef = this.dialog.open(DialogExportissuesComponent, {
        width: '500px',
        data: { sel: this.selectedIssues, orig: original }
      });

      dialogRef.afterClosed().subscribe(result => {
        console.log('The dialog was closed');
      });

    } else if (type === 'all') {

      const dialogRef = this.dialog.open(DialogExportissuesComponent, {
        width: '500px',
        data: original
      });

      dialogRef.afterClosed().subscribe(result => {
        console.log('The dialog was closed');
      });

    }
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.decryptedReportDataChanged.report_vulns, event.previousIndex, event.currentIndex);
    moveItemInArray(this.selectedResult, event.previousIndex, event.currentIndex);
    moveItemInArray(this.scopePreviewHTML, event.previousIndex, event.currentIndex);
  }

  saveReportChanges(report_id: any) {
    this.report_encryption_in_progress = true;
    this.savemsg = 'Please wait, report is encrypted...';
    const pass = this.sessionsub.getSessionStorageItem(report_id) || '';
    let useAPI = false;

    this.indexeddbService.getkeybyReportID(report_id).then(data => {
      if (data) {

        if (data.NotFound === 'NOOK') {
          console.log('no locally report');
          useAPI = true;
        } else {

          // update report
          this.decryptedReportDataChanged.report_version = this.decryptedReportDataChanged.report_version + 1;
          this.addtochangelog('Save report v.' + this.decryptedReportDataChanged.report_version);
          // tslint:disable-next-line:max-line-length
          this.indexeddbService.prepareupdatereport(this.decryptedReportDataChanged, pass, this.report_info.report_id, this.report_info.report_name, this.report_info.report_createdate, data.key).then(retu => {
            if (retu) {
              this.reportdesc.report_lastupdate = retu;
              this.report_encryption_in_progress = false;
              this.savemsg = 'All changes saved successfully!';
              this.lastsavereportdata = retu;
              this.doStats();

              this.removeSureYouWanttoLeave();

              this.snackBar.open('All changes saved successfully!', 'OK', {
                duration: 3000,
                panelClass: ['notify-snackbar-success']
              });
            }
          });

        }

      }
    }).then(() => {

      if (useAPI === true) {


        this.indexeddbService.checkAPIreportchanges(this.report_id).then(re => {
          if (re) {
            //console.log(re);
            //console.log(re.report_lastupdate);
            //console.log(this.reportdesc.report_lastupdate);

            if (this.reportdesc.report_lastupdate === re.report_lastupdate) {
              console.log('no changes');

              this.indexeddbService.searchAPIreport(this.report_info.report_id).then(ret => {

                if (ret === 'API_ERROR') {
                  console.log('api problems');

                  const dialogRef = this.dialog.open(DialogApierrorComponent, {
                    width: '400px',
                    disableClose: true
                  });

                  dialogRef.afterClosed().subscribe(result => {

                    if (result === 'tryagain') {
                      console.log('User select: try again');
                      this.saveReportChanges(this.report_info.report_id);
                    }

                    if (result === 'savelocally') {
                      console.log('User select: save locally');
                      try {
                        this.decryptedReportDataChanged.report_version = this.decryptedReportDataChanged.report_version + 1;
                        this.addtochangelog('Save report v.' + this.decryptedReportDataChanged.report_version);
                        // Encrypt
                        const ciphertext = Crypto.AES.encrypt(JSON.stringify(this.decryptedReportDataChanged), pass);
                        const now: number = Date.now();
                        const to_update = {
                          report_id: uuid(),
                          report_name: this.report_info.report_name,
                          report_createdate: this.report_info.report_createdate,
                          report_lastupdate: now,
                          encrypted_data: ciphertext.toString()
                        };

                        this.indexeddbService.cloneReportadd(to_update).then(data => {
                          if (data) {
                            this.removeSureYouWanttoLeave();
                            this.router.navigate(['/my-reports']);
                          }
                        });

                      } catch (except) {
                        console.log(except);
                      }

                    }
                  });

                } else {
                  this.decryptedReportDataChanged.report_version = this.decryptedReportDataChanged.report_version + 1;
                  this.addtochangelog('Save report v.' + this.decryptedReportDataChanged.report_version);
                  // tslint:disable-next-line:max-line-length
                  this.indexeddbService.prepareupdateAPIreport(ret.api, ret.apikey, this.decryptedReportDataChanged, pass, this.report_info.report_id, this.report_info.report_name, this.report_info.report_createdate).then(retu => {
                    if (retu === 'NOSPACE') {
                      this.savemsg = '';
                      this.report_encryption_in_progress = false;
                    } else {
                      this.report_encryption_in_progress = false;
                      this.reportdesc.report_lastupdate = retu;
                      this.savemsg = 'All changes saved on remote API successfully!';
                      this.lastsavereportdata = retu;
                      this.doStats();
                      this.removeSureYouWanttoLeave();

                      this.snackBar.open('All changes saved on remote API successfully!', 'OK', {
                        duration: 3000,
                        panelClass: ['notify-snackbar-success']
                      });
                    }

                  });

                }

              });


            } else {
              console.log('report changes detected!!!');


              const dialogRef = this.dialog.open(DialogApierrorComponent, {
                width: '400px',
                disableClose: true
              });

              dialogRef.afterClosed().subscribe(result => {

                if (result === 'tryagain') {
                  console.log('User select: try again');
                  this.saveReportChanges(this.report_info.report_id);
                }

                if (result === 'savelocally') {
                  console.log('User select: save locally');
                  try {
                    this.decryptedReportDataChanged.report_version = this.decryptedReportDataChanged.report_version + 1;
                    this.addtochangelog('Save report v.' + this.decryptedReportDataChanged.report_version);
                    // Encrypt
                    const ciphertext = Crypto.AES.encrypt(JSON.stringify(this.decryptedReportDataChanged), pass);
                    const now: number = Date.now();
                    const to_update = {
                      report_id: uuid(),
                      report_name: this.report_info.report_name,
                      report_createdate: this.report_info.report_createdate,
                      report_lastupdate: now,
                      encrypted_data: ciphertext.toString()
                    };

                    this.indexeddbService.cloneReportadd(to_update).then(data => {
                      if (data) {
                        this.removeSureYouWanttoLeave();
                        this.router.navigate(['/my-reports']);
                      }
                    });

                  } catch (except) {
                    console.log(except);
                  }

                }
              });

            }

          }
        });

      }

    });

  }


  getTags(items) {
    const ret = items.filter(function (el) {
      return (el.tags.length !== 0);
    });

    return ret.length;
  }

  getAllTAgs() {

    const rettag = this.decryptedReportDataChanged.report_vulns.filter(function (el) {
      return (el.tags.length > 0);
    });

    if (rettag.length > 0) {
      const xxx: any[] = [];
      this.RaportsTags = [];
      rettag.forEach(function (value) {
        value.tags.forEach(function (tagval) {

          if (!xxx.includes(tagval.name)) {
            xxx.push(tagval.name);
          }

        });
      });
      this.RaportsTags = xxx;

    }

    return this.RaportsTags
  }

  sortbycvss() {
    this.deselectall();
    //this.decryptedReportDataChanged.report_vulns = this.decryptedReportDataChanged.report_vulns.sort((a, b) => b.cvss - a.cvss);
    this.selectedResult = this.selectedResult.sort((a, b) => b.cvss - a.cvss);
  }

  sortbyseverity() {

    this.deselectall();

    const critical: any[] = [];

    const high: any[] = [];

    const medium: any[] = [];

    const low: any[] = [];

    const info: any[] = [];

    for (const [key, value] of Object.entries(this.decryptedReportDataChanged.report_vulns)) {

      if (value) {
        if (value["severity"] === "Critical") {
          critical.push(value);
        } else if (value["severity"] === "High") {
          high.push(value);
        } else if (value["severity"] === "Medium") {
          medium.push(value);
        } else if (value["severity"] === "Low") {
          low.push(value);
        } else if (value["severity"] === "Info") {
          info.push(value);
        }
      }

    }

    const merge = [...critical, ...high, ...medium, ...low, ...info];

    this.decryptedReportDataChanged.report_vulns = merge;

    this.selectedResult = merge.slice(0, this.pageSize);

  }

  addCustomcontent(item) {

    const dialogRef = this.dialog.open(DialogCustomcontentComponent, {
      width: '550px',
      height: '450px',
      data: item
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');

      if (result) {
        if (result !== '') {
          this.decryptedReportDataChanged.report_settings.report_html = result;
        }
      }
    });

  }

  addCustomcss(item) {

    const dialogRef = this.dialog.open(DialogReportcssComponent, {
      width: '550px',
      height: '450px',
      data: item
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      if (result || result === "") {
        this.decryptedReportDataChanged.report_settings.report_css = result;
      }
    });

  }


  editreporttitle(item) {

    const dialogRef = this.dialog.open(DialogEditComponent, {
      width: '450px',
      data: item
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      if (result) {
        if (result !== 'nochanges') {
          this.report_info.report_name = result;
          this.sureYouWanttoLeave();
        }
      }
    });

  }

  changesecuritykey(report_id: string) {

    const dialogRef = this.dialog.open(DialogChangekeyComponent, {
      width: '450px'
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');

      if (result) {
        this.updateSecKey(report_id, result);
      }

    });

  }

  updateSecKey(report_id, pass) {

    this.savemsg = 'Please wait, report is encrypted...';
    this.sessionsub.setSessionStorageItem(report_id, pass);

    // update report
    this.addtochangelog('Change report security key');
    this.decryptedReportDataChanged.report_version = this.decryptedReportDataChanged.report_version + 1;
    this.addtochangelog('Save report v.' + this.decryptedReportDataChanged.report_version);

    this.indexeddbService.getkeybyReportID(report_id).then(data => {
      if (data) {

        if (data.NotFound === 'NOOK') {
          console.log('no locally report');
        } else {
          // tslint:disable-next-line:max-line-length
          this.indexeddbService.prepareupdatereport(this.decryptedReportDataChanged, pass, this.report_info.report_id, this.report_info.report_name, this.report_info.report_createdate, data.key).then(retu => {
            if (retu) {
              this.savemsg = 'All changes saved successfully!';
              this.lastsavereportdata = retu;
              this.doStats();
            }
          });
        }

      }
    });

  }

  editissuetitle(item) {
    const dialogRef = this.dialog.open(DialogEditComponent, {
      width: '450px',
      data: item
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      if (result) {
        if (result !== 'nochanges') {
          const index: number = this.decryptedReportDataChanged.report_vulns.indexOf(result);
          if (index !== -1) {
            this.decryptedReportDataChanged.report_vulns[index].title = result.title;
            this.afterDetectionNow();
          }
        }
      }
    });
  }
  ngOnDestroy() {
    // unsubscribe to ensure no memory leaks
    this.subscription.unsubscribe();
  }

  addresearcher() {

    const add = {
      reportername: '',
      reportersocial: '',
      reporterwww: '',
      reporteremail: ''
    };

    this.decryptedReportDataChanged.researcher.push(add);
    this.afterDetectionNow();

  }

  removeresearcher(item) {

    const index: number = this.decryptedReportDataChanged.researcher.indexOf(item);

    if (index !== -1) {
      this.decryptedReportDataChanged.researcher.splice(index, 1);
      this.afterDetectionNow();
    }

  }


  addchangelog() {
    const dialogRef = this.dialog.open(DialogChangelogComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');

      if (result !== undefined) {
        this.decryptedReportDataChanged.report_changelog.push(result);
        this.doStats();
      }

    });
  }


  editchangelog(item) {
    const dialogRef = this.dialog.open(DialogChangelogComponent, {
      width: '500px',
      data: item
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');

      if (result) {
        const index: number = this.decryptedReportDataChanged.report_changelog.indexOf(result.origi);

        if (index !== -1) {
          this.decryptedReportDataChanged.report_changelog[index] = { date: result.date, desc: result.desc };
          this.doStats();
        }
      }

    });
  }


  addtochangelog(item) {
    const today: number = Date.now();
    const add_changelog = {
      date: today,
      desc: item
    };

    this.decryptedReportDataChanged.report_changelog.push(add_changelog);
    this.doStats();
  }
  removefromchangelog(item) {
    const remo = 'changelog';
    const dialogRef = this.dialog.open(DialogEditComponent, {
      width: '350px',
      data: [{ remo }, { item }],
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');

      const index: number = this.decryptedReportDataChanged.report_changelog.indexOf(result);

      if (index !== -1) {
        this.decryptedReportDataChanged.report_changelog.splice(index, 1);
        this.doStats();
      }
    });
  }

  removeallfromchangelog() {


    const remo = 'changelog_wipe';
    const dialogRef = this.dialog.open(DialogEditComponent, {
      width: '350px',
      data: [{ remo }],
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      if (result) {
        this.decryptedReportDataChanged.report_changelog = [];
        this.doStats();
      }
    });





  }
  removeIssiue(item) {
    const remo = 'remove';
    const dialogRef = this.dialog.open(DialogEditComponent, {
      width: '350px',
      data: [{ remo }, { item }],
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');

      const index: number = this.decryptedReportDataChanged.report_vulns.indexOf(result);

      if (index !== -1) {
        this.decryptedReportDataChanged.report_vulns.splice(index, 1);
        this.addtochangelog('Remove issue: ' + result.title);
        this.afterDetectionNow();
        this.doStats();
      }

    });
  }



  shareReport(report_id) {
    this.indexeddbService.downloadEncryptedReport(report_id);
  }

  downloadASCII(report_details, metadata) {

    function addNewlines(str) {
      return stringDivider(str, 100, '\n');
    }

    function stringDivider(str, width, spaceReplacer) {
      if (str.length > width) {
        let p = width;
        for (; p > 0 && str[p] !== ' '; p--) { }
        if (p > 0) {
          const left = str.substring(0, p);
          const right = str.substring(p + 1);
          return left + spaceReplacer + stringDivider(right, width, spaceReplacer);
        }
      }
      return str;
    }

    let report_ascii_head = '######################################################\n\
# Report Title: ' + metadata.report_name + '\n\
# Report ID: ' + metadata.report_id + '\n\
# Create Date: ' + new Date(metadata.report_createdate).toLocaleDateString(this.setLocal) + '\n\
# Last Update: ' + new Date(metadata.report_lastupdate).toLocaleDateString(this.setLocal) + '\n';

    if (report_details.researcher.length > 0) {

      report_ascii_head = report_ascii_head + '#####\n# Author: \n';

      report_details.researcher.forEach(function (value, key) {

        if (value.reportername !== '') {
          report_ascii_head = report_ascii_head + '# ' + value.reportername + '';
        }

        if (value.reporteremail !== '') {
          report_ascii_head = report_ascii_head + ' - E-mail: ' + value.reporteremail + '';
        }

        if (value.reportersocial !== '') {
          report_ascii_head = report_ascii_head + ' - Social: ' + value.reportersocial + '';
        }

        if (value.reporterwww !== '') {
          report_ascii_head = report_ascii_head + ' - WWW: ' + value.reporterwww + '';
        }

        report_ascii_head = report_ascii_head + '\n';
      }, this);

    }

    if (report_details.report_scope !== '') {
      report_ascii_head = report_ascii_head + '# Report scope: \n' + addNewlines(report_details.report_scope);
    }

    report_ascii_head = report_ascii_head + '######################################################\n\
# Vulnerabilities:\n\n';

    let report_ascii_vulns = '';
    report_details.report_vulns.forEach(function (value, key) {

      report_ascii_vulns += report_ascii_vulns = '\n-> ' + Number(key + 1) + '. ' + value.title;

      if (value.severity !== '') {
        report_ascii_vulns = report_ascii_vulns + '\n# Severity: ' + value.severity + '\n';
      }

      if (value.date !== '') {
        report_ascii_vulns = report_ascii_vulns + '# Find Date: ' + new Date(value.date).toLocaleDateString(this.setLocal) + '\n';
      }

      if (value.cvss !== '') {
        report_ascii_vulns = report_ascii_vulns + '# CVSS: ' + value.cvss + '\n';
      }

      if (value.cve !== '') {
        report_ascii_vulns = report_ascii_vulns + '# CVE: ' + addNewlines(value.cve) + '\n';
      }

      report_ascii_vulns = report_ascii_vulns + '# Description: \n' + addNewlines(value.desc) + '\n';

      if (value.poc !== '') {
        report_ascii_vulns = report_ascii_vulns + '# PoC: \n' + addNewlines(value.poc) + '\n';
      }

      if (value.ref !== '') {
        report_ascii_vulns = report_ascii_vulns + '# References: \n' + value.ref + '\n\n';
      }


    }, this);

    const report_ascii_end = '\n# Report generated by vulnrepo.com \n######################################################\n';
    const report_ascii = report_ascii_head + report_ascii_vulns + report_ascii_end;

    // download ascii report
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(report_ascii));
    element.setAttribute('download', metadata.report_name + ' ' + metadata.report_id + ' ASCII (vulnrepo.com).txt');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

  }

  embedVideo(event) {
    if (event.checked === false) {
      this.decryptedReportDataChanged.report_settings.report_video_embed = false;
    }
    if (event.checked === true) {
      this.decryptedReportDataChanged.report_settings.report_video_embed = true;
    }
  }

  removeGeninfo(event) {
    if (event.checked === false) {
      this.decryptedReportDataChanged.report_settings.report_remove_lastpage = false;
    }
    if (event.checked === true) {
      this.decryptedReportDataChanged.report_settings.report_remove_lastpage = true;
    }
  }

  removechangelogpage(event) {
    if (event.checked === false) {
      this.decryptedReportDataChanged.report_settings.report_changelog_page = false;
    }
    if (event.checked === true) {
      this.decryptedReportDataChanged.report_settings.report_changelog_page = true;
    }
  }

  parsingdescnewline(event) {
    if (event.checked === false) {
      this.decryptedReportDataChanged.report_settings.report_parsing_desc = false;
    }
    if (event.checked === true) {
      this.decryptedReportDataChanged.report_settings.report_parsing_desc = true;
    }
  }

  parsingpocmarkdown(event) {
    if (event.checked === false) {
      this.decryptedReportDataChanged.report_settings.report_parsing_poc_markdown = false;
    }
    if (event.checked === true) {
      this.decryptedReportDataChanged.report_settings.report_parsing_poc_markdown = true;
    }
  }

  removeattachname(event) {
    if (event.checked === false) {
      this.decryptedReportDataChanged.report_settings.report_remove_attach_name = false;
    }
    if (event.checked === true) {
      this.decryptedReportDataChanged.report_settings.report_remove_attach_name = true;
    }
  }

  removeResearchers(event) {
    if (event.checked === false) {
      this.decryptedReportDataChanged.report_settings.report_remove_researchers = false;
    }
    if (event.checked === true) {
      this.decryptedReportDataChanged.report_settings.report_remove_researchers = true;
    }
  }

  removeIssuestatus(event) {
    if (event.checked === false) {
      this.decryptedReportDataChanged.report_settings.report_remove_issuestatus = false;
    }
    if (event.checked === true) {
      this.decryptedReportDataChanged.report_settings.report_remove_issuestatus = true;
    }
  }

  removeIssuecvss(event) {
    if (event.checked === false) {
      this.decryptedReportDataChanged.report_settings.report_remove_issuecvss = false;
    }
    if (event.checked === true) {
      this.decryptedReportDataChanged.report_settings.report_remove_issuecvss = true;
    }
  }

  removeIssuecve(event) {
    if (event.checked === false) {
      this.decryptedReportDataChanged.report_settings.report_remove_issuecve = false;
    }
    if (event.checked === true) {
      this.decryptedReportDataChanged.report_settings.report_remove_issuecve = true;
    }
  }

  removetagsfromreport(event) {
    if (event.checked === false) {
      this.decryptedReportDataChanged.report_settings.report_remove_issuetags = false;
    }
    if (event.checked === true) {
      this.decryptedReportDataChanged.report_settings.report_remove_issuetags = true;
    }
  }

  parserefmd(str): string {
    const xx = str.split("\n");
    let ar = "";
    xx.forEach((item, index) => {
      item = item.replace(" ", "_");
      ar = ar + `[` + item + `](` + item + `)\n\n`;
    });

    return ar
  }

  DownloadMarkdown(report_info): void {

    const str = `# Security Report
## ` + report_info.report_name + `
##### Report Version: ` + this.decryptedReportDataChanged.report_version + `
##### Report ID: ` + report_info.report_id;

    let str_dates = "";
    if (this.decryptedReportDataChanged.report_metadata.starttest !== '' && this.decryptedReportDataChanged.report_metadata.endtest !== '') {
      const startdatestr = new Date(this.decryptedReportDataChanged.report_metadata.starttest).toLocaleDateString(this.setLocal);

      const enddatestr = new Date(this.decryptedReportDataChanged.report_metadata.endtest).toLocaleDateString(this.setLocal);

      str_dates = `
##### Start date: ` + startdatestr + `
##### End date: ` + enddatestr + `\n\n`;
    }


    const critical = this.decryptedReportDataChanged.report_vulns.filter(function (el) {
      return (el.severity === 'Critical');
    });

    const high = this.decryptedReportDataChanged.report_vulns.filter(function (el) {
      return (el.severity === 'High');
    });

    const medium = this.decryptedReportDataChanged.report_vulns.filter(function (el) {
      return (el.severity === 'Medium');
    });

    const low = this.decryptedReportDataChanged.report_vulns.filter(function (el) {
      return (el.severity === 'Low');
    });

    const info = this.decryptedReportDataChanged.report_vulns.filter(function (el) {
      return (el.severity === 'Info');
    });

    const vulnstats = `## Statistics\n
Severity   | Number 
------|--------------
Critical | `+ critical.length + `
High | `+ high.length + `
Medium | `+ medium.length + `
Low | `+ low.length + `
Info | `+ info.length + `\n\n`;

    const str_scope = `
## Scope
` + this.decryptedReportDataChanged.report_scope + `\n\n`;

    let str_issues = '## Results\n\n';

    this.decryptedReportDataChanged.report_vulns.forEach((item, index) => {
      index = index + 1;
      str_issues = str_issues + `
##### ` + index + `. ` + item.title + `
###### Severity:
` + item.severity + `
###### Description:
` + item.desc + `
###### PoC:
` + item.poc + `
###### References:
` + this.parserefmd(item.ref) + `\n-------------\n\n`;
    });

    let str_researcher = '';
    if (this.decryptedReportDataChanged.report_settings.report_remove_researchers === false) {
      this.decryptedReportDataChanged.researcher.forEach((item, index) => {
        str_researcher = str_researcher + `## Researcher
  > ` + item.reportername + ` ` + item.reportersocial + `\n\n`;
      });
    }

    let str_changelog = '';
    if (this.decryptedReportDataChanged.report_settings.report_changelog_page === false) {
      str_changelog = `## Changelog\n
Date   | Description 
------|--------------\n`;

      this.decryptedReportDataChanged.report_changelog.forEach((item, index) => {

        const rdate = new Date(item.date).toLocaleDateString(this.setLocal);

        str_changelog = str_changelog + rdate + ` | ` + item.desc + `\n`;
      });
      str_changelog = str_changelog + '\n\n';
    }

    let str2 = '';
    if (this.decryptedReportDataChanged.report_settings.report_remove_lastpage === false) {
      str2 = `_Generated by [VULNRΞPO](https://vulnrepo.com/)_`;
    }

    // download MARKDOWN report
    const blob = new Blob([str + str_dates + str_scope + vulnstats + str_issues + str_researcher + str_changelog + str2], { type: 'text/markdown' });
    const link = document.createElement('a');
    const url = window.URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', report_info.report_name + ' ' + report_info.report_id + ' (vulnrepo.com).md');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  DownloadJSON(report_info): void {

    const json = {
      "report_name": report_info.report_name,
      "report_id": report_info.report_id,
      "report_createdate": report_info.report_createdate,
      "report_lastupdate": report_info.report_lastupdate,
      "report_changelog": this.decryptedReportDataChanged.report_changelog,
      "researcher": this.decryptedReportDataChanged.researcher,
      "report_vulns": this.decryptedReportDataChanged.report_vulns,
      "report_version": this.decryptedReportDataChanged.report_version,
      "report_summary": this.decryptedReportDataChanged.report_summary,
      "report_metadata": this.decryptedReportDataChanged.report_metadata,
      "report_scope": this.decryptedReportDataChanged.report_scope,
      "report_settings": this.decryptedReportDataChanged.report_settings
    };

    // download JSON report
    const blob = new Blob([JSON.stringify(json)], { type: 'application/json' });
    const link = document.createElement('a');
    const url = window.URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', report_info.report_name + ' ' + report_info.report_id + ' (vulnrepo.com).json');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  DownloadDOCX_OLD(report_info): void {

    let generatedby = new TextRun('');
    if (!this.decryptedReportDataChanged.report_settings.report_remove_lastpage) {
      generatedby = new TextRun("© Generated by vulnrepo.com | ");
    }

    const buildchangelog = () => {
      let changelogArray: any[] = [];


      for (var i = 0; i < this.decryptedReportDataChanged.report_changelog.length; i++) {

        changelogArray.push(
          new TableRow({
            children: [
              new TableCell({
                width: {
                  size: 1500,
                  type: WidthType.DXA,
                },
                children: [new Paragraph(new Date(this.decryptedReportDataChanged.report_changelog[i].date).toLocaleString(this.setLocal))],
              }),
              new TableCell({
                width: {
                  size: 7510,
                  type: WidthType.DXA,
                },
                children: [new Paragraph(this.decryptedReportDataChanged.report_changelog[i].desc)],
              })
            ],
          }),
        );


      }

      return changelogArray;
    };

    const buildreportsummary = () => {
      let authorArray: any[] = [];

      if (this.decryptedReportDataChanged.report_summary.length > 0) {

        authorArray.push(
          new Paragraph({
            text: "Report summary",
            heading: HeadingLevel.HEADING_1,
            pageBreakBefore: true,
            spacing: {
              after: 200,
              before: 200,
            },
          }),
          new Paragraph({
            text: this.decryptedReportDataChanged.report_summary,
            spacing: {
              after: 200,
            },
          })
        );

      }
      return authorArray;
    };

    const buildmainauthors = () => {
      let authorArray: any[] = [];

      if (this.decryptedReportDataChanged.report_settings.report_remove_researchers === false) {

        authorArray.push(
          new Paragraph({
            text: "Researcher",
            heading: HeadingLevel.HEADING_1,
            pageBreakBefore: true,
            spacing: {
              after: 200,
              before: 200,
            },
          }),

          ...buildauthors(),
        );

      }
      return authorArray;
    };

    const buildmainchangelog = () => {
      let authorArray: any[] = [];

      if (this.decryptedReportDataChanged.report_settings.report_changelog_page === false) {

        if (this.decryptedReportDataChanged.report_changelog.length > 0) {

          authorArray.push(
            new Paragraph({
              text: "Changelog",
              heading: HeadingLevel.HEADING_1,
              spacing: {
                after: 200,
                before: 200,
              },
            }),

            new Table({
              columnWidths: [1500, 7510],
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: {
                        size: 1500,
                        type: WidthType.DXA,
                      },
                      children: [new Paragraph("Date")],
                    }),
                    new TableCell({
                      width: {
                        size: 7510,
                        type: WidthType.DXA,
                      },
                      children: [new Paragraph("Description")],
                    }),
                  ],
                }),
                ...buildchangelog(),
              ],
            })
          );

        }
      }
      return authorArray;
    };

    const buildauthors = () => {
      let authorArray: any[] = [];

      for (var i = 0; i < this.decryptedReportDataChanged.researcher.length; i++) {

        authorArray.push(
          new Paragraph({
            children: [
              new TextRun({
                text: this.decryptedReportDataChanged.researcher[i].reportername + ' (' + this.decryptedReportDataChanged.researcher[i].reporteremail + ')'
              })
            ],
          })
        );

      }
      return authorArray;
    };

    const buildfiles = (x) => {
      let filesArray: any[] = [];

      for (var i = 0; i < this.decryptedReportDataChanged.report_vulns[x].files.length; i++) {

        if (this.decryptedReportDataChanged.report_vulns[x].files[i].type.includes('image')) {

          let filename = "";
          filename = this.decryptedReportDataChanged.report_vulns[x].files[i].title;
          if (this.decryptedReportDataChanged.report_settings.report_remove_attach_name === true) {
            filename = "";
          }

          filesArray.push(

            new ImageRun({
              data: this.decryptedReportDataChanged.report_vulns[x].files[i].data,
              transformation: {
                width: 500,
                height: 400,
              },
            }),
            new TextRun({
              text: 'sha256: ' + this.decryptedReportDataChanged.report_vulns[x].files[i].sha256checksum,
              break: 1,
            }),
            new TextRun({
              text: filename,
              break: 1,
            }),
            new TextRun({
              text: '',
              break: 1,
            })
          );
        }



      }
      return filesArray;
    };

    const buildtags = (x) => {
      let tagsArray: any[] = [];

      const tags: any[] = [];
      for (var i = 0; i < this.decryptedReportDataChanged.report_vulns[x].tags.length; i++) {
        tags.push(this.decryptedReportDataChanged.report_vulns[x].tags[i].name);
      }
      const xy = tags.join(", ");

      tagsArray.push(
        new TextRun({
          text: xy,
          break: 1,
        }),
        new TextRun({
          text: '',
          break: 1,
        })

      );


      return tagsArray;
    };

    const buildrefs = (x) => {
      let refArray: any[] = [];
      if (this.decryptedReportDataChanged.report_vulns[x].ref.length > 0) {
        const ref = this.decryptedReportDataChanged.report_vulns[x].ref.toString().split('\n');
        for (var i = 0; i < ref.length; i++) {
          refArray.push(

            new TextRun({
              text: ref[i],
              break: 1,
            })

          );

        }
      }

      return refArray;
    };

    const buildParagraphissues = () => {
      let paragraphArray: any[] = [];
      for (var i = 0; i < this.decryptedReportDataChanged.report_vulns.length; i++) {
        paragraphArray.push(new Paragraph({
          text: '[' + this.decryptedReportDataChanged.report_vulns[i].severity + '] ' + this.decryptedReportDataChanged.report_vulns[i].title,
          heading: HeadingLevel.HEADING_2,
          spacing: {
            after: 200,
            before: 200,
          }
        }),
        );

        const farr: any[] = [];

        let sev = "";
        if (this.decryptedReportDataChanged.report_vulns[i].severity.length > 0) {
          sev = "Severity: " + this.decryptedReportDataChanged.report_vulns[i].severity;
          farr.push(sev);
        }

        if (this.decryptedReportDataChanged.report_settings.report_remove_issuestatus === false) {
          if (this.decryptedReportDataChanged.report_vulns[i].status) {
            const result = this.utilsService.issueStatustable.filter((sev) => sev.value === this.decryptedReportDataChanged.report_vulns[i].status);
            let stat = "";
            if (result[0].status) {
              stat = "Issue status: " + result[0].status;
              farr.push(stat);
            }
          }
        }

        if (this.decryptedReportDataChanged.report_settings.report_remove_issuecvss === false) {
          let cvss = "";
          if (this.decryptedReportDataChanged.report_vulns[i].cvss.length > 0) {
            cvss = "CVSS: " + this.decryptedReportDataChanged.report_vulns[i].cvss;
            farr.push(cvss);
          }
        }

        if (this.decryptedReportDataChanged.report_settings.report_remove_issuecve === false) {
          let cve = "";
          if (this.decryptedReportDataChanged.report_vulns[i].cve.length > 0) {
            cve = "CVE: " + this.decryptedReportDataChanged.report_vulns[i].cve;
            farr.push(cve);
          }
        }

        const info = farr.join(", ");
        paragraphArray.push(

          new Paragraph({
            children: [
              new TextRun({
                text: info,
                bold: false,
                break: 1,
              }),
              new TextRun({
                text: "",
                break: 1,
              }),
            ],
          }),

        );

        paragraphArray.push(

          new Paragraph({
            children: [
              new TextRun({
                text: "Description:",
                bold: true,
              })
            ],
          }),
          new Paragraph({
            text: this.decryptedReportDataChanged.report_vulns[i].desc,
            spacing: {
              after: 200,
              before: 200,
            }
          })
        );

        paragraphArray.push(

          new Paragraph({
            children: [
              new TextRun({
                text: "Proof of Concept:",
                bold: true,
              })
            ],
          }),
          new Paragraph({
            text: this.decryptedReportDataChanged.report_vulns[i].poc,
            spacing: {
              after: 200,
              before: 200,
            }
          })
        );

        if (this.decryptedReportDataChanged.report_settings.report_remove_issuetags === false) {
          if (this.decryptedReportDataChanged.report_vulns[i].tags.length > 0) {
            paragraphArray.push(

              new Paragraph({
                children: [
                  new TextRun({
                    text: "TAGs:",
                    bold: true,
                  })
                ],
              }),


              new Paragraph({
                children: buildtags(i),
              }),

            );
          }
        }

        paragraphArray.push(

          new Paragraph({
            children: [
              new TextRun({
                text: "References:",
                bold: true,
              })
            ],
          }),


          new Paragraph({
            children: buildrefs(i),
          }),

        );

        if (this.decryptedReportDataChanged.report_vulns[i].files.length > 0) {
          paragraphArray.push(

            new Paragraph({
              children: [
                new TextRun({
                  text: '',
                  break: 1
                }),
                new TextRun({
                  text: "Files:",
                  bold: true,
                })
              ],
            })
          );

          paragraphArray.push(
            new Paragraph({
              children: buildfiles(i),
            }),
            new Paragraph({
              children: [new PageBreak()],
            })
          );
        }


      }
      return paragraphArray;
    };


    const critical = this.decryptedReportDataChanged.report_vulns.filter(function (el) {
      return (el.severity === 'Critical');
    });

    const high = this.decryptedReportDataChanged.report_vulns.filter(function (el) {
      return (el.severity === 'High');
    });

    const medium = this.decryptedReportDataChanged.report_vulns.filter(function (el) {
      return (el.severity === 'Medium');
    });

    const low = this.decryptedReportDataChanged.report_vulns.filter(function (el) {
      return (el.severity === 'Low');
    });

    const info = this.decryptedReportDataChanged.report_vulns.filter(function (el) {
      return (el.severity === 'Info');
    });

    const buildlogo = () => {
      let logoArray: any[] = [];

      if (this.decryptedReportDataChanged.report_settings.report_logo.logo) {
        logoArray.push(

          new ImageRun({
            data: this.decryptedReportDataChanged.report_settings.report_logo.logo,
            transformation: {
              width: this.decryptedReportDataChanged.report_settings.report_logo.width,
              height: this.decryptedReportDataChanged.report_settings.report_logo.height,
            },
          }),

        );
      }

      return logoArray;
    };

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              pageNumbers: {
                start: 1,
                formatType: NumberFormat.DECIMAL,
              },
            },
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    generatedby,
                    new TextRun({
                      children: ["Page: ", PageNumber.CURRENT],
                    }),
                    new TextRun({
                      children: ["/", PageNumber.TOTAL_PAGES],
                    }),
                  ],
                }),
              ],
            }),
          },
          children: [
            new Paragraph({
              children: [
                ...buildlogo(),
              ],
            }),
            new Paragraph({
              text: report_info.report_name,
              heading: HeadingLevel.HEADING_1,
              spacing: {
                before: 2000,
                after: 200
              },
            }),
            new Paragraph("Report Id: " + report_info.report_id),
            new Paragraph("Report Version: " + this.decryptedReportDataChanged.report_version),
            new Paragraph("Create date: " + new Date(report_info.report_createdate).toLocaleDateString(this.setLocal)),
            new Paragraph("Last update: " + new Date(report_info.report_lastupdate).toLocaleDateString(this.setLocal)),
            new Paragraph({
              text: '',
              spacing: {
                after: 200,
                before: 200,
              },
            }),
            new Paragraph({
              text: 'CONFIDENTIAL',
              spacing: {
                before: 200,
              },
              alignment: AlignmentType.CENTER,
              shading: { fill: 'FF0039', color: 'FFFFFF' }
            }),
            new Paragraph({
              text: "Table of Contents",
              heading: HeadingLevel.HEADING_1,
              pageBreakBefore: true,
              spacing: {
                after: 200,
                before: 200,
              },
            }),
            new TableOfContents("Summary", {
              hyperlink: true,
              headingStyleRange: "1-5",
              stylesWithLevels: [],
            }),
            new Paragraph({
              text: "Scope",
              heading: HeadingLevel.HEADING_1,
              pageBreakBefore: true,
              spacing: {
                after: 200,
                before: 200,
              },
            }),
            new Paragraph({
              text: this.decryptedReportDataChanged.report_scope,
              spacing: {
                after: 200,
              },
            }),
            new Paragraph({
              text: "Statistics and Risk",
              heading: HeadingLevel.HEADING_1,
              spacing: {
                after: 200,
                before: 200,
              },
            }),

            new Table({
              columnWidths: [3505, 5505],
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: {
                        size: 3505,
                        type: WidthType.DXA,
                      },
                      children: [new Paragraph("Severity")],
                      shading: { fill: 'CCCCCC', color: 'FFFFFF' }
                    }),
                    new TableCell({
                      width: {
                        size: 5505,
                        type: WidthType.DXA,
                      },
                      children: [new Paragraph("Number")],
                      shading: { fill: 'CCCCCC', color: 'FFFFFF' }
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      width: {
                        size: 3505,
                        type: WidthType.DXA,
                      },
                      children: [new Paragraph("Critical")],
                      shading: { fill: 'FF0039', color: 'FFFFFF' }
                    }),
                    new TableCell({
                      width: {
                        size: 5505,
                        type: WidthType.DXA,
                      },
                      children: [new Paragraph({
                        text: critical.length.toString(),
                      })],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      width: {
                        size: 3505,
                        type: WidthType.DXA,
                      },
                      children: [new Paragraph("High")],
                      shading: { fill: 'FF7518', color: 'FFFFFF' }
                    }),
                    new TableCell({
                      width: {
                        size: 5505,
                        type: WidthType.DXA,
                      },
                      children: [new Paragraph({
                        text: high.length.toString(),
                      })],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      width: {
                        size: 3505,
                        type: WidthType.DXA,
                      },
                      children: [new Paragraph("Medium")],
                      shading: { fill: 'F9EE06', color: 'FFFFFF' }
                    }),
                    new TableCell({
                      width: {
                        size: 5505,
                        type: WidthType.DXA,
                      },
                      children: [new Paragraph({
                        text: medium.length.toString(),
                      })],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      width: {
                        size: 3505,
                        type: WidthType.DXA,
                      },
                      children: [new Paragraph("Low")],
                      shading: { fill: '3FB618', color: 'FFFFFF' }
                    }),
                    new TableCell({
                      width: {
                        size: 5505,
                        type: WidthType.DXA,
                      },
                      children: [new Paragraph({
                        text: low.length.toString(),
                      })],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      width: {
                        size: 3505,
                        type: WidthType.DXA,
                      },
                      children: [new Paragraph("Info")],
                      shading: { fill: '2780E3', color: 'FFFFFF' }
                    }),
                    new TableCell({
                      width: {
                        size: 5505,
                        type: WidthType.DXA,
                      },
                      children: [new Paragraph({
                        text: info.length.toString(),
                      })],
                    }),
                  ],
                }),
              ],
            }),

            new Paragraph({
              text: 'The risk of application security vulnerabilities discovered during an assessment will be rated according to a custom-tailored version of the OWASP Risk Rating Methodology. Risk severity is determined based on the estimated technical and business impact of the vulnerability, and on the estimated likelihood of the vulnerability being exploited:',
              spacing: {
                after: 200,
                before: 200,
              },
            }),

            new Table({
              columnWidths: [1802, 1802, 1802, 1802, 1802],
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: {
                        size: 1802,
                        type: WidthType.DXA,
                      },
                      children: [new Paragraph({
                        text: "Overall Risk Severity",
                        alignment: AlignmentType.CENTER,
                      })],
                      columnSpan: 5,
                      shading: { fill: 'CCCCCC', color: 'FFFFFF' }
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      width: {
                        size: 1802,
                        type: WidthType.DXA,
                      },
                      children: [
                        new Paragraph({
                          text: "Impact",
                        })
                      ],
                      rowSpan: 4,
                    }),
                    new TableCell({
                      width: {
                        size: 1802,
                        type: WidthType.DXA,
                      },
                      children: [
                        new Paragraph({
                          text: "HIGH",
                        })
                      ],
                    }),
                    new TableCell({
                      width: {
                        size: 1802,
                        type: WidthType.DXA,
                      },
                      children: [
                        new Paragraph({
                          text: "Medium",
                        })
                      ],
                      shading: { fill: 'F9EE06', color: 'FFFFFF' }
                    }),
                    new TableCell({
                      width: {
                        size: 1802,
                        type: WidthType.DXA,
                      },
                      children: [
                        new Paragraph({
                          text: "High",
                        })
                      ],
                      shading: { fill: 'FF7518', color: 'FFFFFF' }
                    }),
                    new TableCell({
                      width: {
                        size: 1802,
                        type: WidthType.DXA,
                      },
                      children: [
                        new Paragraph({
                          text: "Critical",
                        })
                      ],
                      shading: { fill: 'FF0039', color: 'FFFFFF' }
                    }),
                  ],
                }),

                new TableRow({
                  children: [
                    new TableCell({
                      width: {
                        size: 1802,
                        type: WidthType.DXA,
                      },
                      children: [
                        new Paragraph({
                          text: "MEDIUM",
                        })
                      ],
                    }),
                    new TableCell({
                      width: {
                        size: 1802,
                        type: WidthType.DXA,
                      },
                      children: [
                        new Paragraph({
                          text: "Low",
                        })
                      ],
                      shading: { fill: '3FB618', color: 'FFFFFF' }
                    }),
                    new TableCell({
                      width: {
                        size: 1802,
                        type: WidthType.DXA,
                      },
                      children: [
                        new Paragraph({
                          text: "Medium",
                        })
                      ],
                      shading: { fill: 'F9EE06', color: 'FFFFFF' }
                    }),
                    new TableCell({
                      width: {
                        size: 1802,
                        type: WidthType.DXA,
                      },
                      children: [
                        new Paragraph({
                          text: "High",
                        })
                      ],
                      shading: { fill: 'FF7518', color: 'FFFFFF' }
                    }),
                  ],
                }),

                new TableRow({
                  children: [
                    new TableCell({
                      width: {
                        size: 1802,
                        type: WidthType.DXA,
                      },
                      children: [
                        new Paragraph({
                          text: "LOW",
                        })
                      ],
                    }),
                    new TableCell({
                      width: {
                        size: 1802,
                        type: WidthType.DXA,
                      },
                      children: [
                        new Paragraph({
                          text: "Info",
                        })
                      ],
                      shading: { fill: '2780E3', color: 'FFFFFF' }
                    }),
                    new TableCell({
                      width: {
                        size: 1802,
                        type: WidthType.DXA,
                      },
                      children: [
                        new Paragraph({
                          text: "Low",
                        })
                      ],
                      shading: { fill: '3FB618', color: 'FFFFFF' }
                    }),
                    new TableCell({
                      width: {
                        size: 1802,
                        type: WidthType.DXA,
                      },
                      children: [
                        new Paragraph({
                          text: "Medium",
                        })
                      ],
                      shading: { fill: 'F9EE06', color: 'FFFFFF' }
                    }),
                  ],
                }),


                new TableRow({
                  children: [
                    new TableCell({
                      width: {
                        size: 1802,
                        type: WidthType.DXA,
                      },
                      children: [
                        new Paragraph({
                          text: "",
                        })
                      ],
                    }),
                    new TableCell({
                      width: {
                        size: 1802,
                        type: WidthType.DXA,
                      },
                      children: [
                        new Paragraph({
                          text: "LOW",
                        })
                      ],
                    }),
                    new TableCell({
                      width: {
                        size: 1802,
                        type: WidthType.DXA,
                      },
                      children: [
                        new Paragraph({
                          text: "MEDIUM",
                        })
                      ],
                    }),
                    new TableCell({
                      width: {
                        size: 1802,
                        type: WidthType.DXA,
                      },
                      children: [
                        new Paragraph({
                          text: "HIGH",
                        })
                      ],
                    }),
                  ],
                }),

                new TableRow({
                  children: [
                    new TableCell({
                      width: {
                        size: 1802,
                        type: WidthType.DXA,
                      },
                      children: [new Paragraph({
                        text: "Likelihood",
                        alignment: AlignmentType.CENTER,
                      })],
                      columnSpan: 5,
                      shading: { fill: 'CCCCCC', color: 'FFFFFF' }
                    }),
                  ],
                }),

              ],
            }),

            new Paragraph({
              text: 'Our Risk rating is based on this calculation: Risk = Likelihood * Impact.',
              spacing: {
                after: 200,
                before: 200,
              },
            }),

            new Paragraph({
              text: "Issues (" + this.decryptedReportDataChanged.report_vulns.length + ")",
              heading: HeadingLevel.HEADING_1,
              pageBreakBefore: true,
              spacing: {
                after: 200,
                before: 200,
              },
            }),

            /// issues start
            ...buildParagraphissues(),
            /// issues end
            ...buildreportsummary(),
            ...buildmainauthors(),
            ...buildmainchangelog(),
          ],
        },
      ],
    });


    Packer.toBlob(doc).then((blob) => {

      // download DOCX report
      //const blob = new Blob([JSON.stringify(json)], { type: 'application/json' });
      const link = document.createElement('a');
      const url = window.URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', report_info.report_name + ' ' + report_info.report_id + ' (vulnrepo.com).docx');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    });


  }

  async DownloadDOCX(report_info): Promise<void> {
    try {
      // Get the template to use
      const template = await this.templateService.getDefaultTemplate();
      
      if (!template) {
        // Fallback to old method if no template available
        this.snackBar.open('No DOCX template found. Please upload a template in Settings.', 'Close', { duration: 5000 });
        return;
      }

      // Prepare template data
      const templateData = this.prepareTemplateData(report_info);
      
      // Convert template to ArrayBuffer
      const templateBuffer = this.templateService.templateToArrayBuffer(template);
      
      // Process template with data
      const handler = new TemplateHandler();
      
      const docBuffer = await handler.process(templateBuffer, templateData);
      
      // Convert ArrayBuffer to Blob
      const docBlob = new Blob([docBuffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      
      // Download the generated document
      this.downloadBlob(docBlob, `${report_info.report_name} ${report_info.report_id} (vulnrepo.com).docx`);
      
    } catch (error) {
      console.error('Error generating DOCX:', error);
      this.snackBar.open('Error generating DOCX report. Please try again.', 'Close', { duration: 5000 });
    }
  }

  /**
   * Parse PoC markdown and prepare for DOCX with images and formatted blocks
   */
  preparePoCForDocx(pocContent: string, pocImages: any[] = []): any {
    const images: any = {};
    const blocks: any[] = [];
    let cursor = 0;
    const content = pocContent || '';
    const imgRe = /!\[([^\]]*)\]\((poc-img:[^)]+|data:image\/[^)]+)\)/g;
    let m;
    let imageCounter = 1;

    let blockCounter = 1;
    const pushTextBlock = (text: string) => {
      const trimmed = text.trim();
      if (trimmed && trimmed.length) {
        const paragraphBlocks = this.markdownToParagraphBlocks(trimmed);
        
        // Add each paragraph as a separate block
        paragraphBlocks.forEach(paragraphBlock => {
          const blockName = `poc_block_${blockCounter++}`;
          blocks.push({
            name: blockName,
            content: paragraphBlock
          });
        });
      }
    };

    while ((m = imgRe.exec(content)) !== null) {
      const [full, altText, src] = m;
      const before = content.slice(cursor, m.index);
      pushTextBlock(before);
      cursor = m.index + full.length;

      let imageBuffer: ArrayBuffer | null = null;
      let format = 'image/png';

      if (src.startsWith('poc-img:')) {
        const imageId = src.substring('poc-img:'.length);
        const imageData = pocImages.find(img => img.id === imageId);
        if (imageData) {
          const base64Data = (imageData.data || '').split(',')[1] || '';
          imageBuffer = this.base64ToBuffer(base64Data);
          format = imageData.type || format;
        }
      } else if (src.startsWith('data:image/')) {
        const base64Data = src.split(',')[1] || '';
        imageBuffer = this.base64ToBuffer(base64Data);
        const fmt = src.match(/data:image\/([^;]+)/);
        format = fmt ? `image/${fmt[1]}` : format;
      }

      if (imageBuffer) {
        const imageName = `poc_image_${imageCounter++}`;
        const imgObj = {
          _type: 'image',
          source: imageBuffer,
          format: this.mimeTypeToFormat(format),
          width: 400,
          height: 300,
          altText: altText || 'PoC Image'
        };
        // for legacy templates that directly place {poc_image_N}
        images[imageName] = imgObj;
        // for new templates (mixed content)
        const blockName = `poc_block_${blockCounter++}`;
        blocks.push({
          name: blockName,
          content: imgObj
        });
      } else {
        pushTextBlock(`[Missing Image: ${altText}]`);
      }
    }

    // tail
    const tail = content.slice(cursor);
    pushTextBlock(tail);

    return {
      text: content,       // legacy: plain markdown text
      images: images,      // legacy: expose each {poc_image_N}
      blocks: blocks       // new: rich sequence of rawXml paragraphs and images
    };
  }

  // Helper method to convert base64 to buffer
  private base64ToBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer; // Return ArrayBuffer, not Uint8Array
  }

  // Helper method to convert MIME type to easy-template-x format
  private mimeTypeToFormat(mimeType: string): any {
    switch (mimeType.toLowerCase()) {
      case 'image/png':
        return MimeType.Png;
      case 'image/jpeg':
      case 'image/jpg':
        return MimeType.Jpeg;
      case 'image/gif':
        return MimeType.Gif;
      case 'image/bmp':
        return MimeType.Bmp;
      default:
        return MimeType.Png; // Default fallback
    }
  }

  // Helper method to escape XML characters
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // Helper method to build WordprocessingML run elements
  private buildRunXml(text: string, opts: { bold?: boolean; italic?: boolean; code?: boolean; } = {}): string {
    const prParts: string[] = [];
    if (opts.bold) prParts.push('<w:b/>');
    if (opts.italic) prParts.push('<w:i/>');
    if (opts.code) prParts.push('<w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/>');
    const rPr = prParts.length ? `<w:rPr>${prParts.join('')}</w:rPr>` : '';
    
    // Handle newlines in code blocks
    if (opts.code && text.includes('\n')) {
      const lines = text.split('\n');
      const runs: string[] = [];
      
      for (let i = 0; i < lines.length; i++) {
        const escapedLine = this.escapeXml(lines[i]);
        runs.push(`<w:r>${rPr}<w:t xml:space="preserve">${escapedLine}</w:t></w:r>`);
        
        // Add line break (except for last line)
        if (i < lines.length - 1) {
          runs.push(`<w:r>${rPr}<w:br/></w:r>`);
        }
      }
      
      return runs.join('');
    }
    
    // Normal single-line text
    const t = this.escapeXml(text);
    return `<w:r>${rPr}<w:t xml:space="preserve">${t}</w:t></w:r>`;
  }

  // Helper method to build WordprocessingML paragraph elements
  private buildParagraphXml(runsXml: string, opts: { headingLevel?: number; codeBlock?: boolean } = {}): string {
    let pPr = '';
    
    if (opts.headingLevel && opts.headingLevel >= 1 && opts.headingLevel <= 3) {
      // mimic heading by larger size + bold
      const sizes = {1: 36, 2: 28, 3: 24};
      const sz = sizes[opts.headingLevel as 1|2|3] || 24;
      pPr = `<w:pPr><w:rPr><w:b/><w:sz w:val="${sz}"/></w:rPr></w:pPr>`;
    } else if (opts.codeBlock) {
      // Add gray background shading for code blocks
      pPr = `<w:pPr><w:shd w:val="clear" w:color="auto" w:fill="F5F5F5"/></w:pPr>`;
    }
    
    return `<w:p>${pPr}${runsXml}</w:p>`;
  }

  // Helper method to parse inline Markdown formatting
  private parseInlineMarkdown(line: string): Array<{text: string; bold?: boolean; italic?: boolean; code?: boolean;}> {
    // very small subset: **bold**, *italic*, `code`
    const tokens: Array<{text: string; bold?: boolean; italic?: boolean; code?: boolean;}> = [];
    let i = 0;
    const push = (txt: string, fmt?: any) => { if (txt) tokens.push({ text: txt, ...fmt }); };

    while (i < line.length) {
      if (line.startsWith('**', i)) {
        const end = line.indexOf('**', i + 2);
        if (end > -1) { push(line.slice(i + 2, end), { bold: true }); i = end + 2; continue; }
      }
      if (line.startsWith('*', i)) {
        const end = line.indexOf('*', i + 1);
        if (end > -1) { push(line.slice(i + 1, end), { italic: true }); i = end + 1; continue; }
      }
      if (line.startsWith('`', i)) {
        const end = line.indexOf('`', i + 1);
        if (end > -1) { push(line.slice(i + 1, end), { code: true }); i = end + 1; continue; }
      }
      // normal char
      const next = Math.min(
        ...['**', '*', '`'].map(t => { const p = line.indexOf(t, i); return p === -1 ? Number.POSITIVE_INFINITY : p; })
      );
      const end = next === Number.POSITIVE_INFINITY ? line.length : next;
      push(line.slice(i, end));
      i = end;
    }
    return tokens;
  }

  // Helper method to convert Markdown to array of paragraph blocks
  private markdownToParagraphBlocks(md: string): Array<{_type: string, xml: string, replaceParagraph: boolean}> {

    const lines = md.split(/\r?\n/);
    const blocks: Array<{_type: string, xml: string, replaceParagraph: boolean}> = [];
    let inCode = false;
    let codeBuf: string[] = [];

    const addBlock = (xml: string) => {
      if (xml.trim()) {
        blocks.push({
          _type: 'rawXml',
          xml: xml,
          replaceParagraph: true
        });
      }
    };

    for (let idx = 0; idx < lines.length; idx++) {
      const raw = lines[idx];

      // code fence
      if (raw.trim().startsWith('```')) {
        if (!inCode) { inCode = true; codeBuf = []; }
        else {
          const codeText = codeBuf.join('\n');
          addBlock(this.buildParagraphXml(this.buildRunXml(codeText, { code: true }), { codeBlock: true }));
          inCode = false; codeBuf = [];
        }
        continue;
      }
      if (inCode) { 
        codeBuf.push(raw); 
        continue; 
      }

      // images handled elsewhere; keep line if includes other text
      if (/!\[[^\]]*]\([^)]+\)/.test(raw) && raw.trim().match(/^!\[[^\]]*]\([^)]+\)$/)) {
        // pure image line: skip here; image will be injected as its own block
        continue;
      }

      // headings
      const h = raw.match(/^(#{1,6})\s+(.*)$/);
      if (h) {
        const level = Math.min(h[1].length, 3);
        const inline = this.parseInlineMarkdown(h[2]).map(tok => this.buildRunXml(tok.text, { ...tok, bold: true })).join('');
        addBlock(this.buildParagraphXml(inline, { headingLevel: level }));
        continue;
      }

      // unordered list
      const ul = raw.match(/^[-*]\s+(.*)$/);
      if (ul) {
        const content = `• ${ul[1]}`;
        const inline = this.parseInlineMarkdown(content).map(tok => this.buildRunXml(tok.text, tok)).join('');
        addBlock(this.buildParagraphXml(inline));
        continue;
      }

      // ordered list
      const ol = raw.match(/^(\d+)\.\s+(.*)$/);
      if (ol) {
        const content = `${ol[1]}. ${ol[2]}`;
        const inline = this.parseInlineMarkdown(content).map(tok => this.buildRunXml(tok.text, tok)).join('');
        addBlock(this.buildParagraphXml(inline));
        continue;
      }

      // blockquote
      const bq = raw.match(/^>\s+(.*)$/);
      if (bq) {
        const inline = this.parseInlineMarkdown(bq[1]).map(tok => this.buildRunXml(tok.text, { ...tok, italic: true })).join('');
        addBlock(this.buildParagraphXml(inline));
        continue;
      }

      // blank line -> skip (don't add empty paragraphs)
      if (!raw.trim()) { 
        continue; 
      }

      // normal paragraph
      const inline = this.parseInlineMarkdown(raw).map(tok => this.buildRunXml(tok.text, tok)).join('');
      addBlock(this.buildParagraphXml(inline));
    }

    // if ended inside code block (unclosed), flush as code
    if (inCode && codeBuf.length) {
      addBlock(this.buildParagraphXml(this.buildRunXml(codeBuf.join('\n'), { code: true }), { codeBlock: true }));
    }

    return blocks;
  }

  // Legacy method for backward compatibility
  private markdownToRawXml(md: string): string {
    const blocks = this.markdownToParagraphBlocks(md);
    return blocks.map(b => b.xml).join('');
  }

  /**
   * Prepare data for template processing
   */
  prepareTemplateData(report_info) {
    // Calculate statistics
    const critical = this.decryptedReportDataChanged.report_vulns.filter(el => el.severity === 'Critical');
    const high = this.decryptedReportDataChanged.report_vulns.filter(el => el.severity === 'High');
    const medium = this.decryptedReportDataChanged.report_vulns.filter(el => el.severity === 'Medium');
    const low = this.decryptedReportDataChanged.report_vulns.filter(el => el.severity === 'Low');
    const info = this.decryptedReportDataChanged.report_vulns.filter(el => el.severity === 'Info');

    const templateData: any = {
      // Report metadata
      report_name: report_info.report_name,
      report_id: report_info.report_id,
      report_version: this.decryptedReportDataChanged.report_version,
      create_date: new Date(report_info.report_createdate).toLocaleDateString(this.setLocal),
      last_update: new Date(report_info.report_lastupdate).toLocaleDateString(this.setLocal),
      
      // Report content
      scope: this.decryptedReportDataChanged.report_scope || 'No scope defined',
      summary: this.decryptedReportDataChanged.report_summary || 'No summary provided',
      
      // Statistics
      total_issues: this.decryptedReportDataChanged.report_vulns.length,
      critical_count: critical.length,
      high_count: high.length,
      medium_count: medium.length,
      low_count: low.length,
      info_count: info.length,
      
      // Issues for loops
      issues: this.decryptedReportDataChanged.report_vulns.map((vuln, index) => {
        const pocResult = this.preparePoCForDocx(vuln.poc || 'No proof of concept provided', vuln.poc_images || []);
        const descResult = this.preparePoCForDocx(vuln.desc || 'No description provided', vuln.desc_images || []);

        
        const issueData: any = {
          index: index + 1,
          title: vuln.title || 'Untitled Issue',
          severity: vuln.severity || 'Low',
          description: descResult.text || vuln.desc || 'No description provided',
          proof_of_concept: pocResult.text,       // legacy

          references: vuln.ref || 'No references provided',
          cvss: vuln.cvss || 'N/A',
          cvss_vector: vuln.cvss_vector || 'N/A',
          cve: vuln.cve || 'N/A',
          tags: vuln.tags ? vuln.tags.join(', ') : 'None',
          poc_blocks: pocResult.blocks,           // new (array for loop)
          desc_blocks: descResult.blocks          // new (array for loop for description)
        };
        
        // Add legacy image keys (optional for backward compatibility)
        Object.assign(issueData, pocResult.images);
        Object.assign(issueData, descResult.images);
        
        // Add each block as a named property for direct reference
        pocResult.blocks.forEach(block => {
          if (block.name) {
            issueData[block.name] = block.content;
          }
        });
        
        // Add description blocks as named properties
        descResult.blocks.forEach(block => {
          if (block.name) {
            issueData['desc_' + block.name] = block.content;
          }
        });
         
         return issueData;
      }),
      
      // Changelog
      changelog: this.decryptedReportDataChanged.report_changelog.map(entry => ({
        date: new Date(entry.date).toLocaleString(this.setLocal),
        description: entry.desc || 'No description'
      })),
      
      // Authors/Researchers
      researchers: this.decryptedReportDataChanged.researcher?.map(researcher => ({
        name: researcher.name || 'Unknown',
        email: researcher.email || 'N/A',
        role: researcher.role || 'Researcher'
      })) || [],
      
      // Additional metadata
      generated_by: this.decryptedReportDataChanged.report_settings.report_remove_lastpage ? 
        '' : '© Generated by vulnrepo.com',
      confidential: 'CONFIDENTIAL',
      current_date: new Date().toLocaleDateString(this.setLocal)
    };

    // Add logo only if it exists
    if (this.decryptedReportDataChanged.report_settings.report_logo.logo) {
      templateData.logo = {
        _type: 'image',
        source: this.decryptedReportDataChanged.report_settings.report_logo.logo,
        width: this.decryptedReportDataChanged.report_settings.report_logo.width,
        height: this.decryptedReportDataChanged.report_settings.report_logo.height
      };
    }

    return templateData;
  }

  /**
   * Helper method to download blob as file
   */
  private downloadBlob(blob: Blob, filename: string): void {
    const link = document.createElement('a');
    const url = window.URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  getDataSynchronous(file) {
    return this.http.get('/assets/res/' + file, { responseType: 'text' }).toPromise()
  }


  DownloadHTMLreportv2(res, encrypted, ciphertext, json, report_info) {
    // download HTML report
    let blob = new Blob();
    if (encrypted) {
      blob = new Blob([res.replace("{'HERE':'REPLACE'};", "'" + ciphertext + "';")], { type: 'text/html' });
    } else {
      var jsondata = JSON.stringify(json);
      blob = new Blob([res.replace("{'HERE':'REPLACE'};", "'" + btoa(encodeURIComponent(jsondata)) + "';")], { type: 'text/html' });
    }

    const link = document.createElement('a');
    const url = window.URL.createObjectURL(blob);
    let encryptedtext = "";
    if (encrypted) {
      encryptedtext = " encrypted";
    }
    link.setAttribute('href', url);
    link.setAttribute('download', report_info.report_name + ' ' + report_info.report_id + encryptedtext + ' (vulnrepo.com).html');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    this.hidespinner();
    link.click();
    document.body.removeChild(link);
  }

  encrypt_reportv2(report_info, encrypted, type_dep): void {
    const dialogRef = this.dialog.open(DialogEncryptReportComponent, {
      width: '600px',
      //height: '985px',
      disableClose: true,
      data: []
    });


    dialogRef.afterClosed().subscribe(result => {
      console.log('Encrypt report dialog was closed');
      if (result) {
        this.DownloadHTMLv2(report_info, encrypted, type_dep, result);
      }
    });

  }


  DownloadHTMLv2(report_info, encrypted, type_dep, encpass): void {
    this.showspinner();
    const json = {
      "report_name": report_info.report_name,
      "report_id": report_info.report_id,
      "report_createdate": report_info.report_createdate,
      "report_lastupdate": report_info.report_lastupdate,
      "report_changelog": this.decryptedReportDataChanged.report_changelog,
      "researcher": this.decryptedReportDataChanged.researcher,
      "report_vulns": this.decryptedReportDataChanged.report_vulns,
      "report_version": this.decryptedReportDataChanged.report_version,
      "report_summary": this.decryptedReportDataChanged.report_summary,
      "report_metadata": this.decryptedReportDataChanged.report_metadata,
      "report_scope": this.decryptedReportDataChanged.report_scope,
      "report_settings": this.decryptedReportDataChanged.report_settings,
      "report_encrypted_t": true
    };

    const report_dep_css_obj = [
      { "filename": "bootstrap/5.2.3/css/bootstrap.rtl.min.css", "integrity": "sha512-tC3gnye8BsHmrW3eRP3Nrj/bs+CSVUfzkjOlfLNrfvcbKXFxk5+b8dQCZi9rgVFjDudwipXfqEhsKMMgRZGCDw==" },
      { "filename": "bootstrap-icons/1.10.3/font/bootstrap-icons.min.css", "integrity": "sha512-YFENbnqHbCRmJt5d+9lHimyEMt8LKSNTMLSaHjvsclnZGICeY/0KYEeiHwD1Ux4Tcao0h60tdcMv+0GljvWyHg==" }
    ];

    const report_dep_js_obj = [
      { "filename": "jquery/3.6.3/jquery.min.js", "integrity": "sha512-STof4xm1wgkfm7heWqFJVn58Hm3EtS31XFaagaa8VMReCXAkQnJZ+jEy8PCC/iT18dFy95WcExNHFTqLyp72eQ==" },
      { "filename": "crypto-js/4.1.1/crypto-js.min.js", "integrity": "sha512-E8QSvWZ0eCLGk4km3hxSsNmGWbLtSCSUcewDQPQWZF6pEU8GlT8a5fF32wOl1i8ftdMhssTrF/OhyGWwonTcXA==" },
      { "filename": "bootstrap/5.2.3/js/bootstrap.bundle.min.js", "integrity": "sha512-i9cEfJwUwViEPFKdC1enz4ZRGBj8YQo6QByFTF92YXHi7waCqyexvRD75S5NVTsSiTv7rKWqG9Y5eFxmRsOn0A==" },
      { "filename": "marked/15.0.0/marked.min.js", "integrity": "sha512-/tpw1ej/DTEJDoX8qZM1YY8H9bz2+2T9nhojBmizu9JDVNvjXvgA3zfRjVF96V3bwK6Uf3eIqrYKIKRZx203iA==" },
      { "filename": "dompurify/2.4.1/purify.min.js", "integrity": "sha512-uHOKtSfJWScGmyyFr2O2+efpDx2nhwHU2v7MVeptzZoiC7bdF6Ny/CmZhN2AwIK1oCFiVQQ5DA/L9FSzyPNu6Q==" },
      { "filename": "Chart.js/4.4.0/chart.umd.js", "integrity": "sha512-6HrPqAvK+lZElIZ4mZ64fyxIBTsaX5zAFZg2V/2WT+iKPrFzTzvx6QAsLW2OaLwobhMYBog/+bvmIEEGXi0p1w==" },
      { "filename": "highlight.js/11.10.0/highlight.min.js", "integrity": "sha512-6yoqbrcLAHDWAdQmiRlHG4+m0g/CT/V9AGyxabG8j7Jk8j3r3K6due7oqpiRMZqcYe9WM2gPcaNNxnl2ux+3tA==" },
      { "filename": "marked-highlight/2.2.1/index.umd.min.js", "integrity": "sha512-T5TNAGHd65imlc6xoRDq9hARHowETqOlOGMJ443E+PohphJHbzPpwQNBtcpmcjmHmQKLctZ/W3H2cY/T8EGDPA==" }

    ];
    let ciphertext = "";
    if (encpass === 'userepokey') {
      ciphertext = Crypto.AES.encrypt(JSON.stringify(json), this.sessionsub.getSessionStorageItem(report_info.report_id));
    } else {
      ciphertext = Crypto.AES.encrypt(JSON.stringify(json), encpass);
    }


    this.http.get('/assets/html_report_v2_template.html?v=' + new Date(), { responseType: 'text' }).subscribe(res => {

      if (this.decryptedReportDataChanged.report_settings.report_css !== '') {
        res = res.replace("/*[CSS_Injection_here]*/", DOMPurify.sanitize(this.decryptedReportDataChanged.report_settings.report_css))
      }

      if (type_dep === "mini") {

        let css_String = "";
        let js_String = "";

        report_dep_css_obj.forEach(function (value) {
          css_String = css_String + '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/' + value.filename + '" integrity="' + value.integrity + '" crossorigin="anonymous" referrerpolicy="no-referrer" />\n';
        });
        res = res.replace("<depstyle></depstyle>", css_String);

        report_dep_js_obj.forEach(function (value) {
          js_String = js_String + '<script src="https://cdnjs.cloudflare.com/ajax/libs/' + value.filename + '" integrity="' + value.integrity + '" crossorigin="anonymous" referrerpolicy="no-referrer"></script>\n';
        });
        res = res.replace("<depscripts></depscripts>", js_String);
        this.DownloadHTMLreportv2(res, encrypted, ciphertext, json, report_info);

      } else {

        // FULL REPORT DEP included
        let css_String = "";
        let js_String = "";

        of("bootstrap/5.2.3/css/bootstrap.rtl.min.css", "bootstrap-icons/1.10.3/font/bootstrap-icons.min.css")
          .pipe(
            concatMap(ind => {
              let obs1 = this.http.get('/assets/res/' + ind, { responseType: 'text' })
              return obs1
            })
          ).subscribe(data => {
            css_String = css_String + `<style>
`+ data + `
</style>`;

          }).add(() => {
            //console.log('Finally callback');
            this.http.get('/assets/res/bootstrap-icons/1.10.3/font/fonts/bootstrap-icons.woff2.b64', { responseType: 'text' }).subscribe(ret => {

              css_String = css_String + `<style>
            @font-face{
              font-display:block;
              font-family:bootstrap-icons;
              src:url(data:font/opentype;base64,`+ ret + `) format("woff2"),
              url(data:font/opentype;base64,<wofftag></wofftag>) format("woff")
            }
            </style>`;

              this.http.get('/assets/res/bootstrap-icons/1.10.3/font/fonts/bootstrap-icons.woff.b64', { responseType: 'text' }).subscribe(ret2 => {

                css_String = css_String.replace('<wofftag></wofftag>', ret2);

                res = res.replace("<depstyle></depstyle>", css_String);
                css_String = "";

                of("jquery/3.6.3/jquery.min.js", "crypto-js/4.1.1/crypto-js.min.js", "bootstrap/5.2.3/js/bootstrap.bundle.min.js", "marked/15.0.0/marked.min.js", "dompurify/2.4.1/purify.min.js", "chart-js/4.4.0/chart.js", "highlight.js/11.10.0/highlight.min.js", "marked-highlight/2.2.1/index.umd.min.js")
                  .pipe(
                    concatMap(ind => {
                      let obs1 = this.http.get('/assets/res/' + ind, { responseType: 'text' })
                      return obs1
                    })
                  ).subscribe(data2 => {
                    js_String = js_String + `<script>
            ` + data2 + `
            </script>`;

                  }).add(() => {
                    res = res.replace("<depscripts></depscripts>", js_String);
                    js_String = "";
                    this.DownloadHTMLreportv2(res, encrypted, ciphertext, json, report_info);
                  });

              });


            });

          });


      }
    });
  }

  checksumfile(dataurl, file, dec_data) {
    let file_sha2 = '';
    // sha256 file checksum
    const reader = new FileReader();
    reader.onloadend = (e) => {
      file_sha2 = sha256(reader.result || '');

      this.proccessUpload(dataurl, file.name, file.type, file.size, file_sha2, dec_data);
    };
    reader.readAsArrayBuffer(file);

  }

  proccessUpload(data, name, type, size, sha256check, dec_data) {

    const index: number = this.decryptedReportDataChanged.report_vulns.indexOf(dec_data);
    const today: number = Date.now();

    this.upload_in_progress = false;
    const linkprev = data;
    // tslint:disable-next-line:max-line-length
    this.decryptedReportDataChanged.report_vulns[index].files.push({ 'data': linkprev, 'title': DOMPurify.sanitize(name), 'type': DOMPurify.sanitize(type), 'size': size, 'sha256checksum': sha256check, 'date': today });
    this.afterDetectionNow();

  }

  uploadAttach(input: HTMLInputElement, dec_data) {

    const files = input.files;
    if (files && files.length) {
      this.upload_in_progress = true;
      for (let i = 0; i < files.length; i++) {
        const fileReader = new FileReader();
        fileReader.onload = (e) => {
          this.checksumfile(fileReader.result, files[i], dec_data);
        };
        fileReader.readAsDataURL(files[i]);
      }
    }

  }

  downloadAttach(data, name) {

    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
    const byteString = atob(data.split(',')[1]);

    // separate out the mime component
    const mimeString = data.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to an ArrayBuffer
    const ab = new ArrayBuffer(byteString.length);

    // create a view into the buffer
    const ia = new Uint8Array(ab);

    // set the bytes of the buffer to the correct values
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    // write the ArrayBuffer to a blob, and you're done
    const blob = new Blob([ab], { type: mimeString });

    const fileName = name;
    const link = document.createElement('a');
    const url = window.URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  }


  removeAttach(data, dec_data) {
    const index: number = this.decryptedReportDataChanged.report_vulns.indexOf(dec_data);
    const ind: number = this.decryptedReportDataChanged.report_vulns[index].files.indexOf(data);
    if (ind !== -1) {
      this.decryptedReportDataChanged.report_vulns[index].files.splice(ind, 1);
      this.afterDetectionNow();
    }
  }


  parselogo(data, name, type) {
    const linkprev = 'data:image/png;base64,' + btoa(data);
    this.uploadlogoprev = '<img src="' + linkprev + '" width="100px">';
    this.advlogo = linkprev;
    this.decryptedReportDataChanged.report_settings.report_logo.logo = this.advlogo;
    this.decryptedReportDataChanged.report_settings.report_logo.logo_name = DOMPurify.sanitize(name);
    this.decryptedReportDataChanged.report_settings.report_logo.logo_type = DOMPurify.sanitize(type);
  }

  clearlogo() {
    this.decryptedReportDataChanged.report_settings.report_logo.logo = '';
    this.decryptedReportDataChanged.report_settings.report_logo.logo_name = '';
    this.decryptedReportDataChanged.report_settings.report_logo.logo_type = '';
    this.uploadlogoprev = '';
    this.advlogo = '';
    this.advlogo_saved = '';
    console.log('Logo cleared!');
  }

  importlogo(input: HTMLInputElement) {

    const files = input.files;
    if (files && files.length) {
      /*
       console.log("Filename: " + files[0].name);
       console.log("Type: " + files[0].type);
       console.log("Size: " + files[0].size + " bytes");
       */
      const fileToRead = files[0];
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        this.parselogo(fileReader.result, files[0].name, files[0].type);

      };
      fileReader.readAsBinaryString(fileToRead);
    }

  }


  TAGadd(event: MatChipInputEvent, dec_data): void {

    const value = (event.value || '').trim();

    if (value) {
      const index: number = this.decryptedReportDataChanged.report_vulns.indexOf(dec_data);
      this.decryptedReportDataChanged.report_vulns[index].tags.push({ name: value });
    }

    // Reset the input value
    if (event.input) {
      event.input.value = '';
    }

  }

  TAGremove(tag: Tags, dec_data): void {

    const index: number = this.decryptedReportDataChanged.report_vulns.indexOf(dec_data);
    const ind: number = this.decryptedReportDataChanged.report_vulns[index].tags.indexOf(tag);
    if (ind !== -1) {
      this.decryptedReportDataChanged.report_vulns[index].tags.splice(ind, 1);
    }

  }

  setReportProfile(profile: any) {

    this.uploadlogoprev = '<img src="' + profile.logo + '" width="100px">';
    this.advlogo = profile.logo;
    this.advlogo_saved = '';

    this.selectedtheme = profile.theme;

    // make changes
    this.decryptedReportDataChanged.researcher = [{ reportername: profile.ResName, reportersocial: profile.ResSocial, reporterwww: profile.ResWeb, reporteremail: profile.ResEmail }];
    this.decryptedReportDataChanged.report_settings.report_logo.logo = profile.logo;
    this.decryptedReportDataChanged.report_settings.report_logo.width = profile.logow;
    this.decryptedReportDataChanged.report_settings.report_logo.height = profile.logoh;

    this.decryptedReportDataChanged.report_settings.report_theme = profile.theme;

    this.decryptedReportDataChanged.report_settings.report_css = profile.report_css;
    this.decryptedReportDataChanged.report_settings.report_html = profile.report_custom_content;
    this.decryptedReportDataChanged.report_settings.report_video_embed = profile.video_embed;
    this.decryptedReportDataChanged.report_settings.report_remove_lastpage = profile.remove_lastpage;
    this.decryptedReportDataChanged.report_settings.report_remove_issuestatus = profile.remove_issueStatus;
    this.decryptedReportDataChanged.report_settings.report_remove_issuecvss = profile.remove_issuecvss;
    this.decryptedReportDataChanged.report_settings.report_remove_issuecve = profile.remove_issuecve;
    this.decryptedReportDataChanged.report_settings.report_remove_researchers = profile.remove_researcher;
    this.decryptedReportDataChanged.report_settings.report_changelog_page = profile.remove_changelog;
    this.decryptedReportDataChanged.report_settings.report_remove_issuetags = profile.remove_tags;
    this.decryptedReportDataChanged.report_settings.report_parsing_desc = profile.report_parsing_desc;
    this.decryptedReportDataChanged.report_settings.report_parsing_poc_markdown = profile.report_parsing_poc_markdown;
    this.decryptedReportDataChanged.report_settings.report_remove_attach_name = profile.report_remove_attach_name;
  }

  savenewReportProfile() {

    const time = new Date().toLocaleDateString(this.setLocal);
    const profile = {
      profile_name: time,
      logo: this.decryptedReportDataChanged.report_settings.report_logo.logo,
      logow: this.decryptedReportDataChanged.report_settings.report_logo.width,
      logoh: this.decryptedReportDataChanged.report_settings.report_logo.height,
      report_parsing_desc: this.decryptedReportDataChanged.report_settings.report_parsing_desc,
      report_parsing_poc_markdown: this.decryptedReportDataChanged.report_settings.report_parsing_poc_markdown,
      report_remove_attach_name: this.decryptedReportDataChanged.report_settings.report_remove_attach_name,
      video_embed: this.decryptedReportDataChanged.report_settings.report_video_embed,
      remove_lastpage: this.decryptedReportDataChanged.report_settings.report_remove_lastpage,
      remove_issueStatus: this.decryptedReportDataChanged.report_settings.report_remove_issuestatus,
      remove_issuecvss: this.decryptedReportDataChanged.report_settings.report_remove_issuecvss,
      remove_issuecve: this.decryptedReportDataChanged.report_settings.report_remove_issuecve,
      remove_researcher: this.decryptedReportDataChanged.report_settings.report_remove_researchers,
      remove_changelog: this.decryptedReportDataChanged.report_settings.report_changelog_page,
      remove_tags: this.decryptedReportDataChanged.report_settings.report_remove_issuetags,
      ResName: this.decryptedReportDataChanged.researcher[0].reportername,
      ResEmail: this.decryptedReportDataChanged.researcher[0].reporteremail,
      ResSocial: this.decryptedReportDataChanged.researcher[0].reportersocial,
      ResWeb: this.decryptedReportDataChanged.researcher[0].reporterwww
    };
    this.ReportProfilesList = this.ReportProfilesList.concat(profile);
    this.indexeddbService.saveReportProfileinDB(profile).then(ret => { });
    this.getReportProfiles();
  }

  searchBounty(poc) {
    this.fastsearchBB(poc, true);
  }

  fastsearchBB(poc, showsnack) {
    this.BBmsg = 'Please wait, searching...';
    let scope = [];
    this.bugbountylist.forEach(function (item: any) {
      scope = scope.concat(item.domains);
    });

    const regex = /(?:[\w-]+\.)+[\w-]+/g;
    let m;
    const arr: any[] = [];
    while ((m = regex.exec(poc.poc)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === regex.lastIndex) {
        regex.lastIndex++;
      }

      m.forEach((match) => {
        // get only scope & search
        const findedbounty = scope.find(x => x == match);
        if (findedbounty) {
          this.bugbountylist.forEach(function (item: any) {
            const findedbounty2 = item.domains.find(x => x == findedbounty);
            if (findedbounty2) {
              arr.push(item);
            }
          });

        }
      });
    }

    if (showsnack !== false) {
      if (arr.length == 0) {
        this.snackBar.open('No bug-bounty program found :-( !', 'OK', {
          duration: 2000,
          panelClass: ['notify-snackbar-fail']
        });
      } else {
        this.snackBar.open('Found bug-bounty program !!! :-)', 'OK', {
          duration: 2000,
          panelClass: ['notify-snackbar-success']
        });
      }
    }

    const uniqueArray = arr.filter(function (item, pos) {
      return arr.indexOf(item) == pos;
    });

    const index: number = this.decryptedReportDataChanged.report_vulns.indexOf(poc);
    this.decryptedReportDataChanged.report_vulns[index].bounty = [];
    this.decryptedReportDataChanged.report_vulns[index].bounty = this.decryptedReportDataChanged.report_vulns[index].bounty.concat(uniqueArray);

    this.decryptedReportDataChanged.report_vulns[index].bounty = arr.filter(function (item, pos) {
      return arr.indexOf(item) == pos;
    });

    this.BBmsg = '';


  }

  redirectBounty(url) {
    window.open(url, "_blank");
  }

  changePoC(poc) {
    this.fastsearchBB(poc, false);
  }

  editorFullscreenPoC(dec_data): void {

    const index: number = this.decryptedReportDataChanged.report_vulns.indexOf(dec_data);

    const dialogRef = this.dialog.open(DialogEditorFullscreenComponent, {
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '100%',
      width: '100%',
      disableClose: false,
      data: {
        content: this.decryptedReportDataChanged.report_vulns[index].poc,
        pocImages: this.decryptedReportDataChanged.report_vulns[index].poc_images || []
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The Editor-fullscreen dialog was closed');
      if (result) {
        if (typeof result === 'string') {
          // Legacy: just content
          this.decryptedReportDataChanged.report_vulns[index].poc = result;
        } else {
          // New: content + images
          this.decryptedReportDataChanged.report_vulns[index].poc = result.content || '';
          if (result.pocImages && result.pocImages.length > 0) {
            // Initialize poc_images if it doesn't exist
            if (!this.decryptedReportDataChanged.report_vulns[index].poc_images) {
              this.decryptedReportDataChanged.report_vulns[index].poc_images = [];
            }
            // Store PoC images
            this.decryptedReportDataChanged.report_vulns[index].poc_images = result.pocImages;
          }
        }
        this.afterDetectionNow();
      }
    });

  }

  editorFullscreenDesc(dec_data): void {

    const index: number = this.decryptedReportDataChanged.report_vulns.indexOf(dec_data);

    const dialogRef = this.dialog.open(DialogEditorFullscreenComponent, {
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '100%',
      width: '100%',
      disableClose: false,
      data: {
        content: this.decryptedReportDataChanged.report_vulns[index].desc,
        pocImages: this.decryptedReportDataChanged.report_vulns[index].desc_images || []
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The Editor-fullscreen dialog was closed');
      if (result) {
        if (typeof result === 'string') {
          // Legacy: just content
          this.decryptedReportDataChanged.report_vulns[index].desc = result;
        } else {
          // New: content + images
          this.decryptedReportDataChanged.report_vulns[index].desc = result.content || '';
          if (result.pocImages && result.pocImages.length > 0) {
            // Initialize desc_images if it doesn't exist
            if (!this.decryptedReportDataChanged.report_vulns[index].desc_images) {
              this.decryptedReportDataChanged.report_vulns[index].desc_images = [];
            }
            // Store description images
            this.decryptedReportDataChanged.report_vulns[index].desc_images = result.pocImages;
          }
        }
        this.afterDetectionNow();
      }
    });

  }

  editorFullscreenScope(): void {

    const dialogRef = this.dialog.open(DialogEditorFullscreenComponent, {
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '100%',
      width: '100%',
      disableClose: false,
      data: this.decryptedReportDataChanged.report_scope
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The Editor-fullscreen dialog was closed');
      if (result) {
        // Handle both string and object returns (scope editor should only return strings)
        if (typeof result === 'string') {
          this.decryptedReportDataChanged.report_scope = result;
        } else {
          this.decryptedReportDataChanged.report_scope = result.content || '';
        }
      }
    });

  }

  saveTemplate(dec_data): void {

    const dialogRef = this.dialog.open(DialogAddCustomTemplateComponent, {
      width: '600px',
      disableClose: false,
      data: [{
        "title": dec_data.title,
        "poc": "",
        "desc": dec_data.desc,
        "severity": dec_data.severity,
        "ref": dec_data.ref,
        "cvss": dec_data.cvss,
        "cvss_vector": dec_data.cvss_vector,
        "cve": dec_data.cve,
        "tags": dec_data.tags,
      }]
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The add custom template dialog was closed');

      if (result) {
        this.indexeddbService.saveReportTemplateinDB({ "title": result[0].title, "poc": "", "desc": result[0].desc, "severity": result[0].severity, "ref": result[0].ref, "cvss": result[0].cvss, "cvss_vector": result[0].cvss_vector, "cve": result[0].cve, "tags": result[0].tags });
      }

    });

  }


  openattachfullscreen(file, dec_data) {

    const arr: any[] = [];
    for (let item of dec_data.files) {
      if (item.type.includes('image') || item.type.includes('video') && item.data.length <= 30000000) {
        arr.push(item);
      }
    }


    const dialogRef = this.dialog.open(DialogAttachPreviewComponent, {
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '100%',
      width: '100%',
      disableClose: false,
      data: [file, arr, dec_data]
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The Attach-Preview dialog was closed');
      if (result) {

        const index: number = this.decryptedReportDataChanged.report_vulns.indexOf(result[2]);
        for (let file of result[1]) {
          const ind: number = this.decryptedReportDataChanged.report_vulns[index].files.indexOf(file);
          if (ind !== -1) {
            this.decryptedReportDataChanged.report_vulns[index].files.splice(ind, 1);
            this.afterDetectionNow();
          }
        }

      }
    });


  }


  aiasist() {
    console.log('AI start chat');
    this.aiprogress = true;

    const json = {
      "report_name": this.report_info.report_name,
      "report_id": this.report_info.report_id,
      "report_createdate": this.report_info.report_createdate,
      "report_lastupdate": this.report_info.report_lastupdate,
      //"report_changelog": this.decryptedReportDataChanged.report_changelog,
      "researcher": this.decryptedReportDataChanged.researcher,
      "report_vulns": this.decryptedReportDataChanged.report_vulns,
      "report_version": this.decryptedReportDataChanged.report_version,
      "report_summary": this.decryptedReportDataChanged.report_summary,
      "report_metadata": this.decryptedReportDataChanged.report_metadata,
      "report_scope": this.decryptedReportDataChanged.report_scope
      //"report_settings": this.decryptedReportDataChanged.report_settings
    };

    const msgin = `I have attached a JSON report file, don't mention that file, which contains a list of vulnerabilities, can you prepare a report summary for a company as a document, with issue is most important and fix recommendation for board of company ?, mention scope if provided on JSON key "report_scope", mention researcher if provided on JSON key "researcher".
    
    <ATTACHMENT_FILE>
    <FILE_INDEX>File 1</FILE_INDEX>
    <FILE_NAME>`+ this.report_info.report_name + `</FILE_NAME>
    <FILE_CONTENT>
    `+ JSON.stringify(json) + `
    </FILE_CONTENT>
    </ATTACHMENT_FILE>
    `;

    this.decryptedReportDataChanged.report_summary = "";

    let tempx = "";
    this.ollamaService.chatStream(this.models.ollama_url, msgin, this.models.model, [], [], this.models.defaultprompt).subscribe({
      next: (text) => {
        this.decryptedReportDataChanged.report_summary += text;
        tempx += text;
      },
      complete: () => {
        console.log('AI end chat');

        if (tempx.includes("<think>")) {
          const words = tempx.split("</think>");
          this.decryptedReportDataChanged.report_summary = words[1];
        } else {
          this.decryptedReportDataChanged.report_summary = tempx;
        }

        this.aiprogress = false;
      },
      error: () => {

      }
    });


  }

  goaisettings() {

    const dialogRef = this.dialog.open(DialogOllamaSettingsComponent, {
      width: '600px',
      disableClose: false,
      data: []
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The AI-Settings dialog was closed');
      if (result) {

        this.indexeddbService.getkeybyAiintegration().then(ret => {

          if (ret[0]) {
            this.models = ret[0];
          }
        });

      }
    });

  }

  goAIsummary(): void {

    const res: any = {
      "report_name": this.report_info.report_name,
      "report_id": this.report_info.report_id,
      "report_createdate": this.report_info.report_createdate,
      "report_lastupdate": this.report_info.report_lastupdate,
      //"report_changelog": this.decryptedReportDataChanged.report_changelog,
      "researcher": this.decryptedReportDataChanged.researcher,
      "report_vulns": this.decryptedReportDataChanged.report_vulns,
      "report_version": this.decryptedReportDataChanged.report_version,
      "report_summary": this.decryptedReportDataChanged.report_summary,
      "report_metadata": this.decryptedReportDataChanged.report_metadata,
      "report_scope": this.decryptedReportDataChanged.report_scope
      //"report_settings": this.decryptedReportDataChanged.report_settings
    };

    const xxx = JSON.stringify(res);

    const dialogRef = this.dialog.open(DialogOllamaComponent, {
      width: '800px',
      disableClose: true,
      data: [{ "prompt": ``, "files": [{ "filename": this.report_info.report_name + ".json", "date": String(this.currentdateService.getcurrentDate()), "filetype": "json", "file": btoa(unescape(encodeURIComponent(xxx))) }], "images": [] }]
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The AI dialog was closed');
    });

  }

  hidespinner(): void {
    this.spinner.close();
  }
  showspinner(): void {

    this.spinner = this.dialog.open(DialogSpinnerComponent, {
      maxWidth: '250px',
      maxHeight: '250px',
      height: '250px',
      width: '250px',
      disableClose: false,
      panelClass: 'my-css-class-spinner',
      data: ''
    });

  }


  showHistory(report_id): void {

    const dialogRef = this.dialog.open(DialogReportHistoryComponent, {
      width: '600px',
      disableClose: false,
      data: report_id
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The report history dialog was closed');
    });

  }


}

