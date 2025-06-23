import { LightningElement, wire, track } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import getItems from '@salesforce/apex/ItemService.getItems';
import getAccountInfo from '@salesforce/apex/ItemService.getAccountInfo';
import getItemFamilies from '@salesforce/apex/ItemService.getItemFamilies';

export default class ItemPurchaseTool extends LightningElement {
    @track items = [];
    @track filteredItems = [];
    @track filters = { type: [], family: [] };
    @track cart = [];
    @track families = [];
    @track showCart = false;
    @track account = null;
    @track types = [];
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

    get hasAvailableFamilies() {
        return this.families && this.families.length > 0;
    }

    loadFamilies() {
        console.log('Calling loadFamilies...');
        getItemFamilies()
            .then(result => {
                console.log('Fetched families:', result);
                this.families = [...result];
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

    handleSearch(event) {
        const query = event.target.value.toLowerCase();
        this.filteredItems = this.items.filter(item => {
            const name = item.Name?.toLowerCase() || '';
            const desc = item.Description__c?.toLowerCase() || '';
            return name.includes(query) || desc.includes(query);
        });
    }
}
