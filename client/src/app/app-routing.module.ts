import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PostListComponent } from './posts/post-list/post-list.component';
import { PostCreateComponent } from './posts/post-create/post-create.component';
import { SignupComponent } from './auth/signup/signup.component';
import { LoginComponent } from './auth/login/login.component';
import { TripDashboardComponent } from './trip-dashboard/trip-dashboard.component';
import { TripCreateComponent } from './trip-create/trip-create.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { AuthGuard } from './auth/auth.guard';


const routes: Routes = [
  { path: '', redirectTo:'/login', pathMatch:'full'},
  { path:'signup', component: SignupComponent},
  { path:'login', component: LoginComponent},
  { path: 'forgot-password', component: ForgotPasswordComponent},
  { path: 'reset-password', component: ResetPasswordComponent},
  {
    path: 'trips',
    canActivate: [AuthGuard],
    children: [
      { path: '', component: TripDashboardComponent },
      { path: ':tripId', component: PostListComponent },
    ]
  },
  { path: 'create-trip', component: TripCreateComponent, canActivate: [AuthGuard] },
  { path: 'edit-trip/:tripId', component: TripCreateComponent, canActivate: [AuthGuard] },
  { path: 'create-post/:tripId', component: PostCreateComponent, canActivate: [AuthGuard] },
  { path: 'create-post', component: PostCreateComponent, canActivate: [AuthGuard] },
  { path: 'edit/:postId', component: PostCreateComponent, canActivate: [AuthGuard] },

]
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]

})
export class AppRoutingModule {

}