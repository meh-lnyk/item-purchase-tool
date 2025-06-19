@isTest
public class ItemServiceTest {
    @isTest
    static void testGetItems() {
        // Arrange
        insert new Item__c(Name='Test Item', Price__c=10);

        // Act
        List<Item__c> results = ItemService.getItems();

        // Assert
        System.assert(!results.isEmpty(), 'Item list should not be empty');
    }
}
