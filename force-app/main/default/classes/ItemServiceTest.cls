@isTest
public class ItemServiceTest {
    @isTest
    static void testGetItems() {
        insert new Item__c(Name='Test Item', Price__c=10);
        List<Item__c> results = ItemService.getItems();
        System.assert(!results.isEmpty(), 'Item list should not be empty');
    }

    @isTest
    static void coverPurchaseTrigger() {
        Account acc = new Account(Name = 'Test Account');
        insert acc;

        Item__c item = new Item__c(Name = 'Trigger Test Item', Price__c = 25);
        insert item;

        Purchase__c purchase = new Purchase__c(
            ClientId__c = acc.Id,
            TotalItems__c = 0,
            GrandTotal__c = 0
        );
        insert purchase;

        PurchaseLine__c line = new PurchaseLine__c(
            PurchaseId__c = purchase.Id,
            ItemId__c = item.Id,
            Amount__c = 1,
            UnitCost__c = 25
        );
        insert line;
    }

    @isTest
    static void coverItemServiceMethods() {
        Test.startTest();

        Account acc = new Account(Name = 'Coverage Account');
        insert acc;

        Item__c item = new Item__c(Name = 'Coverage Item', Price__c = 20);
        insert item;

        ItemService.getItems();
        ItemService.getItemFamilies();
        ItemService.getAccountInfo(acc.Id);
        ItemService.getUserIsManager(UserInfo.getUserId());
        ItemService.loadPicklistValues();

        CartItemWrapper wrapper = new CartItemWrapper();
        wrapper.itemId = item.Id;
        wrapper.unitCost = item.Price__c;
        wrapper.amount = 2;
        List<CartItemWrapper> cart = new List<CartItemWrapper>{ wrapper };
        ItemService.checkoutCart(acc.Id, JSON.serialize(cart));

        Test.stopTest();
    }

    @isTest
    static void coverUnsplashService() {
        Test.setMock(HttpCalloutMock.class, new MockUnsplashCallout());
        String result = UnsplashService.fetchImageUrl('test');
        System.assertEquals('https://mockimage.com', result);
    }

    @isTest
    static void coverUnsplashResult() {
        UnsplashResult.Urls urls = new UnsplashResult.Urls();
        urls.regular = 'https://example.com/regular.jpg';

        UnsplashResult.Result result = new UnsplashResult.Result();
        result.urls = urls;

        UnsplashResult fullResult = new UnsplashResult();
        fullResult.results = new List<UnsplashResult.Result>{ result };

        System.assertEquals('https://example.com/regular.jpg', fullResult.results[0].urls.regular);
    }
}
