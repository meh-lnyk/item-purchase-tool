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
    public static Id checkoutCart(Id accountId, List<CartItemWrapper> items) {
        System.debug('RAW items: ' + JSON.serialize(items));
        for (CartItemWrapper w : items) {
            System.debug('itemId=' + w.itemId + ', unitCost=' + w.unitCost + ', amount=' + w.amount);
        }

        if (accountId == null || items == null || items.isEmpty()) {
            throw new AuraHandledException('Missing account or cart items.');
        }

        Integer totalItems = 0;
        Decimal grandTotal = 0;

        for (CartItemWrapper item : items) {
            System.debug('Item: ' + JSON.serialize(item));

            Integer qty = item.amount != null ? item.amount : 0;
            Decimal price = item.unitCost != null ? item.unitCost : 0;

            totalItems += qty;
            grandTotal += qty * price;
        }

        Purchase__c purchase = new Purchase__c(
            ClientId__c = accountId,
            TotalItems__c = totalItems,
            GrandTotal__c = grandTotal
        );
        insert purchase;

        System.debug('Created Purchase Id: ' + purchase.Id);

        List<PurchaseLine__c> lines = new List<PurchaseLine__c>();
        for (CartItemWrapper item : items) {
            if (item != null && item.itemId != null && item.amount != null && item.unitCost != null) {
                PurchaseLine__c line = new PurchaseLine__c(
                    PurchaseId__c = purchase.Id,
                    ItemId__c     = item.itemId,
                    Amount__c     = item.amount,
                    UnitCost__c   = item.unitCost
                );
                System.debug('Assembled line: ' + JSON.serialize(line));
                lines.add(line);
            } else {
                System.debug('Null or invalid value in item: ' + JSON.serialize(item));
            }
        }

        System.debug('Cart items received: ' + JSON.serialize(items));
        System.debug('Lines to insert: ' + JSON.serialize(lines));


        for (PurchaseLine__c line : lines) {
            System.debug('PurchaseLine before insert: ' + JSON.serialize(line));
        }

        try {
            insert lines;
            System.debug('Inserted purchase lines successfully.');
        } catch (Exception e) {
            System.debug('Failed to insert purchase lines: ' + e.getMessage());
            throw new AuraHandledException('Insert failed: ' + e.getMessage());
        }

        System.debug('totalItems: ' + totalItems + ', grandTotal: ' + grandTotal);
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
