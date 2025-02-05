import {Component, OnInit} from '@angular/core';
import {LoadingController, ModalController, ToastController} from '@ionic/angular';
import {AuthService, HttpService} from '../../../../providers';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

@Component({
    selector: 'app-add-user',
    templateUrl: './add-user.component.html',
    styleUrls: ['./add-user.component.scss'],
})
export class AddUserComponent implements OnInit {

    public onRegisterForm: FormGroup;
    public countries: any;
    public languages = [];
    public shops: any;
    public profiles: any;
    public filteredProfiles: any;
    private roles = [
        {
            name: 'User',
            value: 0
        },
        {
            name: 'Shop Admin',
            value: 1
        },
        {
            name: 'Main Admin',
            value: 2
        },
    ];

    constructor(
        private modalCtrl: ModalController,
        private httpRequest: HttpService,
        private formBuilder: FormBuilder,
        public loadingCtrl: LoadingController,
        private auth: AuthService,
        public toastController: ToastController
    ) {
    }

    ngOnInit() {
        this.onRegisterForm = this.formBuilder.group({
            'firstName': [null, Validators.compose([
                Validators.required
            ])],
            'lastName': [null, Validators.compose([
                Validators.required
            ])],
            'email': [null, Validators.compose([
                Validators.required
            ])],
            'password': [null, Validators.compose([
                Validators.required
            ])],
            'country': [null, Validators.compose([
                Validators.required
            ])],
            'language': [{value: null, disabled: true}, Validators.compose([
                Validators.required
            ])],
            'role': [null, Validators.compose([
                Validators.required
            ])],
            'shop': [{value: null, disabled: true}],
            'profile': [{value: null, disabled: true}, Validators.compose([Validators.required])]
        });
        this.httpRequest.getCountry().subscribe(res => {
            this.countries = res;
        });
        this.httpRequest.getAllShops().subscribe(res => {
            this.shops = res;
        });
        this.httpRequest.getAllProfiles().subscribe(res => {
            this.profiles = res;
        });
    }

    get f() {
        return this.onRegisterForm.controls;
    }

    selectCountry(item) {
        if (item.detail.value !== null) {
            this.languages = item.detail.value.languages;
        }
        if (this.languages.length != 0) {
            this.onRegisterForm.controls.language.enable();
        } else {
            this.onRegisterForm.controls.language.disable();
        }
    }

    selectRole(item) {
        this.f.profile.setValue(null);
        if (item.detail.value === 1) {
            this.f.shop.enable();
        } else if (item.detail.value === 2) {
            this.f.shop.disable();
            this.filteredProfiles = this.profiles.filter(profile => {
                return profile.isMainAdmin === true;
            });
            this.f.profile.enable();
        } else {
            this.f.shop.enable();
        }
    }

    selectShop(item) {
        if (item.detail.value !== undefined) {
            this.f.profile.setValue(null)
            this.filteredProfiles = this.profiles.filter(profile => {
                if (profile.shopID !== null) {
                    return profile.shopID._id === item.detail.value._id;
                }
            });
            this.f.profile.enable();
        }
    }

    closeModal() {
        this.modalCtrl.dismiss(null);
    }

    async addUser() {
        const loader = await this.loadingCtrl.create({
            duration: 2000
        });

        loader.present();

        const data = {
            firstName: this.f.firstName.value,
            lastName: this.f.lastName.value,
            email: this.f.email.value,
            password: this.f.password.value,
            country: this.f.country.value._id,
            language: this.f.language.value._id,
            role: this.f.role.value,
            shop: this.f.role.value !== 2 && this.f.shop.value !== null ? this.f.shop.value._id : null,
            profile: this.f.profile.value._id
        };
        this.httpRequest.addUser(data).subscribe((res: any) => {
            if (res.unique === false) {
                loader.onWillDismiss().then(() => {
                    this.presentToast('User already exists');
                });
            } else {
                loader.onWillDismiss().then(() => {
                    this.modalCtrl.dismiss(res);
                });
            }
        });
    }

    async presentToast(message) {
        const toast = await this.toastController.create({
            message: message,
            duration: 2000
        });
        toast.present();
    }
}
