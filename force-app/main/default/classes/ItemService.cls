public with sharing class ItemService {
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
    public static Id checkoutCart(String accountId, String itemsJson) {
        List<CartItemWrapper> items = (List<CartItemWrapper>) JSON.deserialize(itemsJson, List<CartItemWrapper>.class);

        Integer totalItems = 0;
        Decimal grandTotal = 0;
        Purchase__c purchase = new Purchase__c(ClientId__c = accountId);
        insert purchase;

        List<PurchaseLine__c> lines = new List<PurchaseLine__c>();
        for (CartItemWrapper item : items) {
            if (item.itemId != null) {
                PurchaseLine__c line = new PurchaseLine__c(
                    PurchaseId__c = purchase.Id,
                    ItemId__c = item.itemId,
                    Amount__c = item.amount != null ? item.amount : 1,
                    UnitCost__c = item.unitCost != null ? item.unitCost : 0
                );
                lines.add(line);
                totalItems++;
                Decimal cost = (item.unitCost != null ? item.unitCost : 0) * (item.amount != null ? item.amount : 1);
                grandTotal += cost;
            }
        }

        if (!lines.isEmpty()) {
            insert lines;
        }

        purchase.TotalItems__c = totalItems;
        purchase.GrandTotal__c = grandTotal;
        update purchase;

        return purchase.Id;
    }

    @AuraEnabled
    public static Boolean getUserIsManager(Id userId) {
        User u = [SELECT IsManager__c FROM User WHERE Id = :userId LIMIT 1];
        return u.IsManager__c;
    }

    @AuraEnabled
    public static Id createItem(Item__c item) {
        try {
            item.Image__c = UnsplashService.fetchImageUrl(item.Name);
            insert item;
            return item.Id;
        } catch (Exception e) {
            System.debug('Error creating item: ' + e.getMessage());
            throw new AuraHandledException('Failed to create item: ' + e.getMessage());
        }
    }
}
