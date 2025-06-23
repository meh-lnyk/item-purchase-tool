import { LightningElement, wire, track } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import getItems from '@salesforce/apex/ItemService.getItems';
import getAccountInfo from '@salesforce/apex/ItemService.getAccountInfo';

export default class ItemPurchaseTool extends LightningElement {
    @track items = [];
    @track filteredItems = [];
    @track filters = { type: [], family: [] };
    @track cart = [];
    @track showCart = false;
    @track account = null;
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
        this.fetchItems();
    }

    fetchItems() {
        getItems()
            .then(result => {
                this.items = result;
                this.filteredItems = [...this.items];
            })
            .catch(error => {
                console.error('Error fetching items:', error);
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

    openCart() {
        this.showCart = true;
    }

    closeCart() {
        this.showCart = false;
    }

    addToCart(event) {
        const itemId = event.detail;
        const item = this.items.find(i => i.Id === itemId);
        if (item && !this.cart.includes(item)) {
            this.cart = [...this.cart, item];
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
}
