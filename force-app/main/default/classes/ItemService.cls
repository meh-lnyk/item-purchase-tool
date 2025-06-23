public with sharing class ItemService {
    public class CartItemWrapper {
        @AuraEnabled public Id itemId;
        @AuraEnabled public Decimal unitCost;
        @AuraEnabled public Integer amount;
    }

    @AuraEnabled(cacheable=true)
    public static List<Item__c> getItems() {
        return [
            SELECT Id, Name, Description__c, Type__c, Family__c, Image__c, Price__c
            FROM Item__c
            ORDER BY Name ASC
            LIMIT 50
        ];
    }

    @AuraEnabled(cacheable=true)
    public static Account getAccountInfo(Id accountId) {
        List<Account> accounts = [
            SELECT Id, Name, AccountNumber, Industry
            FROM Account
            WHERE Id = :accountId
            LIMIT 1
        ];
        if (!accounts.isEmpty()) {
            return accounts[0];
        }
        return null;
    }

    @AuraEnabled(cacheable=true)
    public static List<String> getItemFamilies() {
        Set<String> families = new Set<String>();
        for (AggregateResult ar : [
            SELECT Family__c
            FROM Item__c
            WHERE Family__c != null
            GROUP BY Family__c
        ]) {
            families.add((String) ar.get('Family__c'));
        }
        return new List<String>(families);
    }

    @AuraEnabled
    public static Id checkoutCart(Id accountId, List<CartItemWrapper> items) {
        if (accountId == null || items == null || items.isEmpty()) {
            throw new AuraHandledException('Missing account or cart items.');
        }

        Purchase__c purchase = new Purchase__c(ClientId__c = accountId);
        insert purchase;

        List<PurchaseLine__c> lines = new List<PurchaseLine__c>();
        for (CartItemWrapper item : items) {
            lines.add(new PurchaseLine__c(
                PurchaseId__c = purchase.Id,
                ItemId__c = item.itemId,
                Amount__c = item.amount,
                UnitCost__c = item.unitCost
            ));
        }

        insert lines;

        return purchase.Id;
    }
}
