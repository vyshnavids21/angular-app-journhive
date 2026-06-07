import {
  Component,
  OnInit,
  Input,
  ViewChild,
  ElementRef,
  OnDestroy
} from '@angular/core';
import { Post } from '../../models/post.model';
import { PostsService } from '../../services/posts.service';
import { PageEvent } from '@angular/material/paginator';
import { ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';
import { DownloadService } from 'src/app/services/download.service';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-post-list',
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.scss']
})
export class PostListComponent implements OnInit, OnDestroy {

  @Input() postListArray: Post[] = [];
  @ViewChild('postListSection') postListSection!: ElementRef;

  totalPosts = 0;
  pageSize = 10;
  pageSizeOptions = [10, 20, 30, 50];
  filteredPageSizeOptions: number[] = [];
  currentPage = 0;
  paginatedPosts: Post[] = [];
  tripId: string | null = null;
  tripName: string | null = null;
  isLoading: boolean = true;

  private downloadSubscription: any;

  constructor(
    private postsService: PostsService,
    private route: ActivatedRoute,
    private downloadService: DownloadService
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const name = params.get('tripName');  
      if (name) {
        this.tripName = name.toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-');
      } else {
        this.tripName = 'unknown-trip'; 
      }
    });
    
    this.route.paramMap.subscribe((paramMap) => {
      this.tripId = paramMap.get('tripId');
      this.fetchPosts();
    });

    this.downloadSubscription = this.downloadService.download$.subscribe(() => {
      this.downloadPosts();
    });

  }

  ngOnDestroy(): void {
    if (this.downloadSubscription) {
      this.downloadSubscription.unsubscribe();
    }
  }

  fetchPosts() {
    this.isLoading = true;
    if (!this.tripId) {
      this.postListArray = [];
      this.paginatedPosts = [];
      this.totalPosts = 0;
      return;
    }

    this.postsService.getPostsByTripId(this.tripId).subscribe((data) => {
      this.postListArray = data.posts || [];
      this.totalPosts = this.postListArray.length;
      console.log('postlist array', this.postListArray);
      this.updatePaginatedPosts();
      this.disablePageSizeOptions();
    });
    this.isLoading = false;
  }

  deletePost(postId: string) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This post will be permanently deleted!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#0a1c38',
      cancelButtonColor: '#f28b82'
    }).then((result) => {
      if (result.isConfirmed) {
        this.postsService.deletePost(postId).subscribe(() => {
          this.postListArray = this.postListArray.filter(
            (post) => post.id !== postId
          );
          this.totalPosts = this.postListArray.length;

          this.updatePaginatedPosts();
          this.disablePageSizeOptions();

          Swal.fire('Deleted!', 'The post has been deleted.', 'success');
        });
      }
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
    this.paginatedPosts = this.postListArray.slice(startIndex, endIndex);
  }

  disablePageSizeOptions() {
    const idealMaxOption = this.pageSizeOptions.find(
      (option) => option >= this.totalPosts
    );

    if (this.totalPosts < 5) {
      this.filteredPageSizeOptions = [this.totalPosts];
    } else if (idealMaxOption) {
      this.filteredPageSizeOptions = this.pageSizeOptions.filter(
        (option) => option <= idealMaxOption
      );
    } else {
      this.filteredPageSizeOptions = [...this.pageSizeOptions];
    }

    if (
      this.pageSize > this.totalPosts ||
      !this.filteredPageSizeOptions.includes(this.pageSize)
    ) {
      this.pageSize = this.filteredPageSizeOptions[0] || this.totalPosts;
    }
  }

  convertToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
    });
  }

  async downloadPosts() {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
  
    const margin = 10;
    const colWidth = (pageWidth - margin * 3) / 2;
    const imageHeight = 35;
    const lineHeight = 4;
    const titleLineHeight = 5;
    const bottomPadding = 6;
  
    let y = margin;

    // Destination heading at the top of the document 
    const heading = (this.tripName && this.tripName !== "unknown-trip")
      ? this.tripName.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "My Trip";
    pdf.setFontSize(22);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(10, 28, 56); 
    pdf.text(heading, pageWidth / 2, y + 6, { align: "center" });
    y += 18;

    const computeHeight = (post: any) => {
      if (!post) return 0;
      pdf.setFontSize(12);
      const titleLines = pdf.splitTextToSize(post.title || "Untitled", colWidth - 10).length;
      pdf.setFontSize(10);
      const captionLines = pdf.splitTextToSize(post.caption || "", colWidth - 10).length;
      return imageHeight + 20 + titleLines * titleLineHeight + captionLines * lineHeight + bottomPadding + 10;
    };

    let cardHeight = 0;
    for (const post of this.postListArray) {
      cardHeight = Math.max(cardHeight, computeHeight(post));
    }

    for (let i = 0; i < this.postListArray.length; i += 2) {
      const leftPost = this.postListArray[i];
      const rightPost = this.postListArray[i + 1];

      if (y + cardHeight > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }

      const drawCard = async (post: any, x: number) => {
        if (!post) return;
  
        let imgData: string | undefined;
        if (post.image instanceof File) imgData = await this.convertToBase64(post.image);
        else if (typeof post.image === "string") imgData = post.image;
  
        pdf.setDrawColor(180);
        pdf.setLineWidth(0.4);
        pdf.roundedRect(x, y, colWidth, cardHeight, 3, 3, "S");
  
        if (imgData) {
          try {
            pdf.addImage(imgData, "JPEG", x + 5, y + 5, colWidth - 10, imageHeight);
          } catch {
            pdf.text("Image load failed", x + 5, y + 10);
          }
        } else {
          pdf.text("No Image Added", x + colWidth / 2, y + imageHeight / 2 + 5, { align: "center" });
        }
  
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(10, 28, 56); 
        const wrappedTitle = pdf.splitTextToSize(post.title || "Untitled", colWidth - 10);
        let titleY = y + imageHeight + 12;
        wrappedTitle.forEach((line: string) => {
          pdf.text(line, x + 5, titleY);
          titleY += titleLineHeight;
        });
  
        const caption = post.caption || "";
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(0, 0, 0);
        const wrapped = pdf.splitTextToSize(caption, colWidth - 10);
  
        pdf.setFontSize(10);
        let captionY = titleY + 4;
  
        wrapped.forEach((line: string) => {
          pdf.text(line, x + 5, captionY);
          captionY += lineHeight;
        });
  
        if (post.date) {
          pdf.setFontSize(9);
          const dateY = captionY + bottomPadding;
          pdf.text(`Date: ${new Date(post.date).toDateString()}`, x + 5, dateY);
        }
      };
  
      await drawCard(leftPost, margin);
      await drawCard(rightPost, margin * 2 + colWidth);

      y += cardHeight + margin;
    }
  
    pdf.save(`posts-${this.tripName}.pdf`);
  }    
  
}
