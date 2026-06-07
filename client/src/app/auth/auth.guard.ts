import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { PostsService } from '../services/posts.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(private postsService: PostsService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    if (this.postsService.isLoggedIn()) {
      return true;
    }
    return this.router.createUrlTree(['/login']);
  }
}
