import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { PostsService } from 'src/app/services/posts.service';
import { DownloadService } from 'src/app/services/download.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  showUserMenu: boolean = false;
  public userEmailId: string = '';
  @Output() downloadClick = new EventEmitter<void>();

  constructor(private router: Router, private postsService: PostsService,
    private downloadService: DownloadService
  ) {
  
   }

  ngOnInit(): void {
    this.postsService.getUserEmail().subscribe((email) => {
      this.userEmailId = email || '';
    })
  }

  toggleUserMenu() {
   this.showUserMenu = !this.showUserMenu;
  }

  navigateToCreate() {
    if (this.buttonLabel === 'New Post') {
      this.router.navigate(['/create-trip']);
    }
    else if (this.buttonLabel === 'Add Place') {
      const tripId = this.getCurrentTripId();
      if (tripId) {
        this.router.navigate(['/create-post', tripId]);
      } else {
        this.router.navigate(['/create-post']);
      }
    }
  }

  logout() {
    this.postsService.logout();
    this.router.navigate(['/login']);
  }
  
  navigateToLists() {
    this.router.navigate(['/trips']);
  }

  showArrow(): boolean {
    return this.router.url.includes('create');
  }

  get buttonLabel(): string {
    const url = this.router.url;
    return (url.startsWith('/trips/') || url.startsWith('/create-post')) ? 'Add Place' : 'New Post';
  }

  private getCurrentTripId(): string | null {
    const match = this.router.url.match(/\/trips\/([^\/]+)/);
    return match ? match[1] : null;
  }

  showDownloadButton() : boolean {
   return this.router.url.startsWith('/trips/');
  }

  showArrowBack(): boolean {
    return this.router.url.startsWith('/trips/') || this.router.url.startsWith('/create-trip') || this.router.url.startsWith('/create-post')
  }

  onDownloadPosts() {
    this.downloadService.triggerDownload();
  }
}
