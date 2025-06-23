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
}
