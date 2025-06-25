import { LightningElement, wire, track } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { NavigationMixin } from 'lightning/navigation';
import getItems from '@salesforce/apex/ItemService.getItems';
import getAccountInfo from '@salesforce/apex/ItemService.getAccountInfo';
import getItemFamilies from '@salesforce/apex/ItemService.getItemFamilies';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import checkoutCart from '@salesforce/apex/ItemService.checkoutCart';
import USER_ID from '@salesforce/user/Id';
import getUserIsManager from '@salesforce/apex/ItemService.getUserIsManager';
import createItem from '@salesforce/apex/ItemService.createItem';

export default class ItemPurchaseTool extends NavigationMixin(LightningElement) {
    @track items = [];
    @track filteredItems = [];
    @track filters = { type: [], family: [] };
    @track cart = [];
    @track families = [];
    @track showCart = false;
    @track account = null;
    @track types = [];
    @track isDetailModalOpen = false;
    @track selectedItem = null;
    @track isManager = false;
    @track showCreateModal = false;
    @track newItem = {
        Name: '',
        Description__c: '',
        Type__c: '',
        Family__c: '',
        Price__c: null
    };
    @track typeOptions = [];
    @track familyOptions = [];
    accountId;

    @wire(CurrentPageReference)
    setPageRef(pageRef) {
        if (pageRef && pageRef.state && pageRef.state.c__accountId) {
            this.accountId = pageRef.state.c__accountId;
            console.log('Account ID from URL:', this.accountId);
            this.fetchAccount();
        } else {
            console.warn('Account ID not found in URL');
        }
    }

    connectedCallback() {
        console.log('connectedCallback triggered');
        this.fetchItems();
        this.loadFamilies();
        this.checkManager();
    }

    fetchItems() {
        getItems()
            .then(result => {
            this.items = result;
            this.filteredItems = [...this.items];

            const typeSet = new Set();
            this.items.forEach(item => {
                if (item.Type__c) {
                typeSet.add(item.Type__c);
                }
            });
            this.filters.type = [...typeSet];
            this.typeOptions = [...typeSet].map(type => ({ label: type, value: type }));
            })
            .catch(error => {
                console.error('Error loading account info:', JSON.stringify(error));
            });
    }

    fetchAccount() {
        if (!this.accountId) return;
        getAccountInfo({ accountId: this.accountId })
            .then(result => {
                this.account = result;
                console.log('Fetched account info:', result);
            })
            .catch(error => {
                console.error('Error loading account info:', error);
            });
    }

    get hasAvailableFamilies() {
        return this.families && this.families.length > 0;
    }

    loadFamilies() {
        console.log('Calling loadFamilies...');
        getItemFamilies()
            .then(result => {
                console.log('Fetched families:', result);
                this.families = [...result];
                this.familyOptions = result.map(fam => ({ label: fam, value: fam }));
            })
            .catch(error => {
                console.error('Error fetching families:', error);
            });
    }

    loadTypes() {
        getItemTypes()
            .then(result => {
                console.log('Fetched types:', result);
                this.types = result;
            })
            .catch(error => {
                console.error('Error fetching types:', error);
            });
    }

    openCart() {
        this.showCart = true;
    }

    closeCart() {
        this.showCart = false;
    }

    handleAddToCart(event) {
        const itemId = event.target.dataset.id;
        const item = this.items.find(i => i.Id === itemId);
        if (item && !this.cart.includes(item)) {
            this.cart = [...this.cart, item];
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: `${item.Name} added to cart`,
                    variant: 'success'
                })
            );
        }
    }

    applyFilters(newFilters) {
        this.filters = newFilters;
        this.filteredItems = this.items.filter(item => {
            const matchType = !this.filters.type.length || this.filters.type.includes(item.Type__c);
            const matchFamily = !this.filters.family.length || this.filters.family.includes(item.Family__c);
            return matchType && matchFamily;
        });
    }

    handleSearch(event) {
        const query = event.target.value.toLowerCase();
        this.filteredItems = this.items.filter(item => {
            const name = item.Name?.toLowerCase() || '';
            const desc = item.Description__c?.toLowerCase() || '';
            return name.includes(query) || desc.includes(query);
        });
    }

    handleViewDetails(event) {
        const itemId = event.target.dataset.id;
        const item = this.items.find(i => i.Id === itemId);
        if (item) {
            this.selectedItem = item;
            this.isDetailModalOpen = true;
        }
    }

    closeDetailModal() {
        this.isDetailModalOpen = false;
        this.selectedItem = null;
    }

    handleCheckout() {
        if (!this.cart.length || !this.accountId) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Checkout Failed',
                    message: 'No items in cart or account not found.',
                    variant: 'error'
                })
            );
            return;
        }

        const payload = this.cart.map(item => ({
            itemId: item.Id,
            unitCost: item.Price__c,
            amount: 1
        }));

        const cartPayload = this.cart.map(item => ({
            itemId: item.Id,
            amount: 1,
            unitCost: item.Price__c
        }));
        console.log('Calling checkoutCart with payload:', JSON.stringify(payload));
        console.log('Cart:', JSON.stringify(this.cart));
        checkoutCart({ accountId: this.accountId, items: cartPayload })
            .then(purchaseId => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Purchase created',
                        variant: 'success'
                    })
                );
                this.cart = [];
                this.showCart = false;
                if (this[NavigationMixin.Navigate]) {
                    this[NavigationMixin.Navigate]({
                        type: 'standard__recordPage',
                        attributes: {
                            recordId: purchaseId,
                            objectApiName: 'Purchase__c',
                            actionName: 'view'
                        }
                    });
                } else {
                    console.warn('NavigationMixin.Navigate is not available.');
                }
            })
            .catch(error => {
                console.error('Checkout error (full object):', JSON.stringify(error));

                let message = 'Unknown error';
                if (error && error.body && error.body.message) {
                    message = error.body.message;
                } else if (error && error.message) {
                    message = error.message;
                }

                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Checkout Failed',
                        message: message,
                        variant: 'error'
                    })
                );
            });
    }

    checkManager() {
        getUserIsManager({ userId: USER_ID })
            .then(result => {
                this.isManager = result;
            })
            .catch(error => {
                console.error('Error checking manager status', error);
            });
    }

    openCreateItemModal() {
        this.showCreateModal = true;
    }

    closeCreateItemModal() {
        this.showCreateModal = false;
    }

    handleItemInput(event) {
        const field = event.target.name || event.target.dataset.field;
        const value = event.detail?.value ?? event.target.value;
        this.newItem = { ...this.newItem, [field]: value };
    }

    createItem() {
        createItem({ item: this.newItem })
            .then(() => {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Success',
                    message: 'Item created',
                    variant: 'success'
                }));
                this.closeCreateItemModal();
                this.fetchItems();
            })
            .catch(error => {
                console.error('Error creating item', error);
            });
    }
}
