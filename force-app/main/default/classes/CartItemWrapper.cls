public class CartItemWrapper {
    @AuraEnabled public Id itemId;
    @AuraEnabled public Decimal unitCost;
    @AuraEnabled public Integer amount;

    public CartItemWrapper() {}
}
