import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { HttpClient } from '@angular/common/http';
import { MatSort } from '@angular/material/sort';
import { IndexeddbService } from '../indexeddb.service';
import {
  animate,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';
import { DialogAddCustomTemplateComponent } from '../dialog-add-custom-template/dialog-add-custom-template.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SessionstorageserviceService } from "../sessionstorageservice.service"
import { ApiService } from '../api.service';

export interface VulnsList {
  title: string;
  poc: string;
  desc: string;
  severity: string;
  ref: string;
  cvss: number;
  cve: string;
  expanded?: boolean;
}

@Component({
  standalone: false,
  //imports: [],
  selector: 'app-templates-list',
  templateUrl: './templates-list.component.html',
  styleUrls: ['./templates-list.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      )
    ])
  ]
})
export class TemplatesListComponent implements OnInit {

  displayedColumns: string[] = ['title', 'severity', 'cvss', 'cve'];
  dataSource = new MatTableDataSource<VulnsList[]>();
  getvulnlistStatus = '';
  countvulns:any = [];
  expandedElement: VulnsList | null;
  sourceSelect = 'CUSTOM';
  reportTemplateList_int:any = [];
  reportTemplateList:any = [];
  local = [];
  json = [];
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(private http: HttpClient, public dialog: MatDialog, private indexeddbService: IndexeddbService,
    private apiService: ApiService, public sessionsub: SessionstorageserviceService) {

    this.getvulnlistStatus = 'Loading...';


  }

  ngOnInit() {

    this.gettemplates();

  }

  gettemplates() {

    this.indexeddbService.retrieveReportTemplates().then(ret => {
      if (ret) {
        this.local = ret;

        this.http.get<any>('/assets/custom.json?v=' + + new Date()).subscribe(res => {
          if (res) {
            this.json = res;

            let xxx = [...this.local, ...this.json];
            this.dataSource = new MatTableDataSource<VulnsList[]>(xxx);
            this.reportTemplateList = this.dataSource.data;
            this.countvulns = xxx;
            this.dataSource.sort = this.sort;
            this.dataSource.paginator = this.paginator;
            this.getvulnlistStatus = '';

            this.getAPITemplates();
          }
        });

      }
    });


  }

  getAPITemplates() {

    const localkey = this.sessionsub.getSessionStorageItem('VULNREPO-API');
    if (localkey) {
      //this.msg = 'API connection please wait...';

      const vaultobj = JSON.parse(localkey);

      vaultobj.forEach((element) => {

        this.apiService.APISend(element.value, element.apikey, 'getreporttemplates', '').then(resp => {
          this.reportTemplateList_int = [];
          if (resp.length > 0) {
            resp.forEach((ele) => {
              ele.api = 'remote';
              ele.apiurl = element.value;
              ele.apikey = element.apikey;
              ele.apiname = element.viewValue;
            });
            this.reportTemplateList_int.push(...resp);
          }

        }).then(() => {

          let xxx = [...this.reportTemplateList, ...this.reportTemplateList_int];
          this.dataSource = new MatTableDataSource<VulnsList[]>(xxx);
          this.countvulns = xxx;
          this.dataSource.sort = this.sort;
          this.dataSource.paginator = this.paginator;
          this.getvulnlistStatus = '';

          //this.msg = '';
        }).catch(() => { });

        //setTimeout(() => {
        // console.log('hide progress timeout');
        //this.msg = '';
        //}, 10000);

      });

    }
  }

  changeselect() {

    if (this.sourceSelect === "VULNREPO") {

      this.getvulnlistStatus = 'Loading...';
      this.http.get<any>('/assets/vulns.json?v=' + + new Date()).subscribe(res => {

        this.dataSource.data = res;
        this.countvulns = res;
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
        this.getvulnlistStatus = '';

      });


    } else if (this.sourceSelect === "CWE") {

      this.getvulnlistStatus = 'Loading...';
      this.http.get<any>('/assets/CWE_V.4.3.json?v=' + + new Date()).subscribe(res => {

        this.dataSource.data = res;
        this.countvulns = res;
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
        this.getvulnlistStatus = '';

      });


    } else if (this.sourceSelect === "MMOBILE") {

      this.getvulnlistStatus = 'Loading...';
      this.http.get<any>('/assets/mobile-attack.json?v=' + + new Date()).subscribe(res => {

        this.dataSource.data = res;
        this.countvulns = res;
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
        this.getvulnlistStatus = '';

      });


    } else if (this.sourceSelect === "MENTERPRISE") {

      this.getvulnlistStatus = 'Loading...';
      this.http.get<any>('/assets/enterprise-attack.json?v=' + + new Date()).subscribe(res => {

        this.dataSource.data = res;
        this.countvulns = res;
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
        this.getvulnlistStatus = '';

      });


    } else if (this.sourceSelect === "OWASPTOP2017") {

      this.getvulnlistStatus = 'Loading...';
      this.http.get<any>('/assets/OWASPtop102017.json?v=' + + new Date()).subscribe(res => {

        this.dataSource.data = res;
        this.countvulns = res;
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
        this.getvulnlistStatus = '';

      });


    } else if (this.sourceSelect === "OWASPTOP2021") {

      this.getvulnlistStatus = 'Loading...';
      this.http.get<any>('/assets/OWASPtop102021.json?v=' + + new Date()).subscribe(res => {

        this.dataSource.data = res;
        this.countvulns = res;
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
        this.getvulnlistStatus = '';

      });


    } else if (this.sourceSelect === "OWASPTOP10CICD") {

      this.getvulnlistStatus = 'Loading...';
      this.http.get<any>('/assets/OWASPtop10cicd.json?v=' + + new Date()).subscribe(res => {

        this.dataSource.data = res;
        this.countvulns = res;
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
        this.getvulnlistStatus = '';

      });


    } else if (this.sourceSelect === "OWASPTOP10k8s") {

      this.getvulnlistStatus = 'Loading...';
      this.http.get<any>('/assets/OWASPtop10k8s.json?v=' + + new Date()).subscribe(res => {

        this.dataSource.data = res;
        this.countvulns = res;
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
        this.getvulnlistStatus = '';

      });


    } else if (this.sourceSelect === "CUSTOM") {

      this.getvulnlistStatus = 'Loading...';
      this.http.get<any>('/assets/custom.json?v=' + + new Date()).subscribe(res => {

        this.dataSource.data = res;
        this.countvulns = res;
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
        this.getvulnlistStatus = '';

      });


    }

  }

  create_issue(): void {

    const dialogRef = this.dialog.open(DialogAddCustomTemplateComponent, {
      width: '600px',
      disableClose: false,
      data: []
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The add custom template dialog was closed');


      if (result) {

        console.log(result);

        this.indexeddbService.saveReportTemplateinDB({ "title": result.title, "poc": "", "desc": result.desc, "recommendations": result.recommendations, "severity": result.severity, "ref": result.ref, "cvss": result.cvss, "cvss_vector": result.cvss_vector, "cve": result.cve, "tags": result.tags });

      }

      this.gettemplates();
    });

  }

}
