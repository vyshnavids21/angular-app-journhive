import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
// import { BehaviorSubject, Observable } from "rxjs";
import { Observable } from 'rxjs';
import { Post } from "../models/post.model";
import { Trip } from "../models/trip.model";
import { User, loginData } from "../models/user.model";
import { BehaviorSubject } from "rxjs";
import { environment } from '../../environments/environment';


@Injectable({
    providedIn: 'root'
})
export class PostsService {

    //frontend only

    // private postSubject = new BehaviorSubject<Post[]>([]); //remembers the last emitted value

    // addPost(post: Post) {
    //   const currentPosts = this.postSubject.value;
    //   this.postSubject.next([...currentPosts, post]);// to get the previously entered data we have to pass currentPosts, post
    // }

    // getPost(): Observable<Post[]> {
    //     return this.postSubject.asObservable();
    // } 


    //when using backend-http client

    private baseUrl = environment.apiUrl;
    private tripApiUrl = `${this.baseUrl}/api/trips`;
    private postApiUrl = `${this.baseUrl}/api/posts`;
    private userApiUrl = `${this.baseUrl}/api/users`; //signup api
    private loginApiUrl = `${this.baseUrl}/api/login`;
    private forgotPasswordApiUrl = `${this.baseUrl}/api/forgot-password`;
    private resetPasswordApiUrl = `${this.baseUrl}/api/reset-password`;
    private userIdSubject = new BehaviorSubject<string | null>(null);
    private userEmailSubject = new BehaviorSubject<string | null>(null);


    constructor(private http: HttpClient) {
       const savedUserId = localStorage.getItem('userId');
       if (savedUserId) {
         this.userIdSubject.next(savedUserId);
       }

       const savedUserEmail = localStorage.getItem('userEmail');
       if (savedUserEmail) {
         this.userEmailSubject.next(savedUserEmail);
       }
     }

    // getPost(): Observable<{ message: string, posts: Post[] }> {
    //     return this.http.get<{ message: string, posts: Post[] }>(this.postApiUrl);
    // }

    addTrip(trip: FormData): Observable<{ message: string, trips: Trip[]}> {
      return this.http.post<{ message: string, trips: Trip[]}>(this.tripApiUrl, trip);
    }

    addPost(post: FormData): Observable<{ message: string, posts: Post[] }> {
        return this.http.post<{ message: string, posts: Post[] }>(this.postApiUrl, post);
    }

    getPostsByCreatorId(creatorId: string): Observable<{ message: string, posts: Post[] }> {
        return this.http.get<{ message: string, posts: Post[] }>(`${this.postApiUrl}/creator/${creatorId}`);
    }

    getTripByCreatorId(creatorId: string): Observable<{ message: string, trips: Trip[]}> { //fetch trips corresponding to each user
        return this.http.get<{ message: string, trips: Trip[]}>(`${this.tripApiUrl}/creator/${creatorId}`);
    }

    getPostsByTripId(tripId: string): Observable<{message: string, posts: Post[]}> {
        return this.http.get<{message: string, posts: Post[]}>(`${this.postApiUrl}/trip/${tripId}`);
    }

    deletePost(postId: string) {
        return this.http.delete(`${this.postApiUrl}/${postId}`);
    }

    deleteTrip(tripId: string) {
        return this.http.delete(`${this.tripApiUrl}/${tripId}`);
    }


    getPostById(postId: string): Observable<Post> {
        return this.http.get<Post>(`${this.postApiUrl}/${postId}`);
    }

    getTripById(tripId: string): Observable<Trip> {
        return this.http.get<Trip>(`${this.tripApiUrl}/${tripId}`);
    }

    updateTrip(tripId: string, tripData: FormData): Observable<{ message: string, trips: Trip[]} > {
      return this.http.put<{ message: string, trips: Trip[]}>(`${this.tripApiUrl}/${tripId}`, tripData);
    }

    updatePost( postId: string, post: FormData): Observable<{ message: string, posts: Post[] }> {
        return this.http.put<{ message: string, posts: Post[] }>(`${this.postApiUrl}/${postId}`,post);
    }

    saveSignupData(data: FormData): Observable<{message: string, user: User}> {
        return this.http.post<{message:string, user: User}>(this.userApiUrl,data);
    }

    getSignupData(): Observable<{message: string, users: User[]}> {
        return this.http.get<{message: string, users: User[]}>(this.userApiUrl);
    }

    saveLoginData(data: FormData): Observable<{ message: string; user: User }> {
        return this.http.post<{ message: string; user: User }>(this.loginApiUrl, data);
    }

    getLoginData(): Observable<{message: string, users: loginData[]}> {
        return this.http.get<{message: string, users: loginData[]}>(this.loginApiUrl);
    }

    forgotPassword(email: string): Observable<{ message: string, previewUrl?: string }> {
        return this.http.post<{ message: string, previewUrl?: string }>(this.forgotPasswordApiUrl, { email });
    }

    resetPassword(token: string, password: string): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(this.resetPasswordApiUrl, { token, password });
    }

    setToken(token: string | null) {
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }

    getToken(): string | null {
        return localStorage.getItem('token');
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }

    logout() {
        this.setToken(null);
        this.setUserId(null);
        this.setUserEmail(null);
    }

    setUserId(userId: string | null) {
        this.userIdSubject.next(userId);
        if (userId) {
            localStorage.setItem('userId', userId);
        } else {
            localStorage.removeItem('userId');
        }
    }

    getUserId(): Observable<string | null> {
        return this.userIdSubject.asObservable();
    }

    setUserEmail(userEmail: string | null) {
        this.userEmailSubject.next(userEmail);
        if (userEmail) {
            localStorage.setItem('userEmail', userEmail);
        } else {
            localStorage.removeItem('userEmail');
        }
    }

    getUserEmail(): Observable<string | null> {
        return this.userEmailSubject.asObservable();
    }

}