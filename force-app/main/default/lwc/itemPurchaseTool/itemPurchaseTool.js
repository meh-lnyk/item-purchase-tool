import { LightningElement, wire, track } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import getItems from '@salesforce/apex/ItemService.getItems';
import getAccountInfo from '@salesforce/apex/ItemService.getAccountInfo';
import getItemFamilies from '@salesforce/apex/ItemService.getItemFamilies';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import checkoutCart from '@salesforce/apex/ItemService.checkoutCart';

export default class ItemPurchaseTool extends LightningElement {
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

        checkoutCart({ accountId: this.accountId, items: payload })
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
                // Redirect to new Purchase record
                this[NavigationMixin.Navigate]({
                    type: 'standard__recordPage',
                    attributes: {
                        recordId: purchaseId,
                        objectApiName: 'Purchase__c',
                        actionName: 'view'
                    }
                });
            })
            .catch(error => {
                console.error('Checkout error:', JSON.stringify(error));
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Checkout Failed',
                        message: error.body?.message || 'Unknown error',
                        variant: 'error'
                    })
                );
            });
    }
}
