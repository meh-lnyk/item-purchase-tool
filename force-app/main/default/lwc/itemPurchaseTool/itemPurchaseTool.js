import { LightningElement, track } from 'lwc';
import getItems from '@salesforce/apex/ItemService.getItems';

export default class ItemPurchaseTool extends LightningElement {
    @track items = [];

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
        console.log('Add to cart clicked');
    }
}
