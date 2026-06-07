import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { PostsService } from '../services/posts.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-trip-dashboard',
  templateUrl: './trip-dashboard.component.html',
  styleUrls: ['./trip-dashboard.component.scss']
})
export class TripDashboardComponent implements OnInit {

  public creatorId = '';
  totalPosts = 0;
  pageSize = 12;
  pageSizeOptions = [12, 24, 36, 48];
  filteredPageSizeOptions: number[] = [];
  currentPage = 0;
  paginatedPosts: any[] = [];
  userId: string = '';
  public tripListArray: any[] = [];
  isLoading: boolean = true;

  constructor(private postsService: PostsService, private router: Router) {
    this.fetchPosts();
  }

  ngOnInit(): void {
    this.fetchPosts();
  }

  fetchPosts() {
    this.isLoading = true;
    this.postsService.getUserId().subscribe((id) => {
      if (!id) {
        return;
      }

      this.userId = id;

      // First fetch all trips for this user
      this.postsService.getTripByCreatorId(this.userId).subscribe((tripData) => {
        const trips = tripData.trips || [];

        // Then fetch all posts for this user to calculate travel spot counts per trip
        this.postsService.getPostsByCreatorId(this.userId).subscribe((postData) => {
          const posts = postData.posts || [];

          // Attach postsCount to each trip based on matching tripId
          this.tripListArray = trips.map((trip: any) => {
            const tripId = trip.id || trip._id;
            const spotsCount = posts.filter((post: any) => post.tripId === tripId).length;
            return {
              ...trip,
              postsCount: spotsCount
            };
          });
          console.log('trip list with postsCount', this.tripListArray);

          this.totalPosts = this.tripListArray.length;
          this.updatePaginatedPosts();
          this.disablePageSizeOptions();
          this.isLoading = false; 
        });
      });
    });
  }

  deletePost(id: string) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This post will be permanently deleted!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#0a1c38',
      cancelButtonColor: '#f28b82'
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.postsService.deleteTrip(id).subscribe(() => {
          this.tripListArray = this.tripListArray.filter(trip => (trip.id || trip._id) !== id);
          this.totalPosts = this.tripListArray.length;
          this.updatePaginatedPosts();
          this.disablePageSizeOptions();
          Swal.fire('Deleted!', 'The trip has been deleted.', 'success');
        });
      }
    });
  }

  viewTrip(trip: any) {
    const tripId = trip.id || trip._id;
    if (!tripId) {
      return;
    }
    this.router.navigate(['/trips', tripId], {
      queryParams: { tripName: trip.destination}
    });
  }

  onChangePage(event: PageEvent) {
    if (event.pageSize !== this.pageSize) {
      this.pageSize = event.pageSize;
      this.currentPage = 0;
    } else {
      this.currentPage = event.pageIndex;
    }
    this.updatePaginatedPosts();
  }

  updatePaginatedPosts() {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedPosts = this.tripListArray.slice(startIndex, endIndex);
  }

  disablePageSizeOptions() {
    const idealMaxOption = this.pageSizeOptions.find(option => option >= this.totalPosts);

    if (this.totalPosts < 5) {
      this.filteredPageSizeOptions = [this.totalPosts];
    } else if (idealMaxOption) {
      this.filteredPageSizeOptions = this.pageSizeOptions.filter(
        (option) => option <= idealMaxOption
      );
    } else {
      this.filteredPageSizeOptions = [...this.pageSizeOptions];
    }

    if (this.pageSize > this.totalPosts || !this.filteredPageSizeOptions.includes(this.pageSize)) {
      this.pageSize = this.filteredPageSizeOptions[0] || this.totalPosts;
    }
  }


}
