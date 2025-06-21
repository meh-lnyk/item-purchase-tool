import { LightningElement, track } from 'lwc';
import getItems from '@salesforce/apex/ItemService.getItems';

export default class ItemPurchaseTool extends LightningElement {
    @track items = [];
    @track cart = [];
    @track isCartModalOpen = false;

    connectedCallback() {
        getItems()
            .then(result => {
                this.items = result;
            })
            .catch(error => {
                console.error('Error loading items:', error);
            });
    }

    handleAddToCart(event) {
        const itemId = event.target.dataset.id;
        const selectedItem = this.items.find(item => item.Id === itemId);

        if (selectedItem) {
            this.cart.push(selectedItem);
            console.log('Cart updated:', this.cart);
        }
    }

    openCart() {
        this.isCartModalOpen = true;
    }

    closeCart() {
        this.isCartModalOpen = false;
    }
}
