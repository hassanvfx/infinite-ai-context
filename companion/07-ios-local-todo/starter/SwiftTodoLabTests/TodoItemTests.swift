import XCTest
@testable import SwiftTodoLab

final class TodoItemTests: XCTestCase {
    func testTodoItemRoundTripsThroughJSON() throws {
        let task = TodoItem(title: "Check the journal", completed: true)
        let data = try JSONEncoder().encode(task)
        XCTAssertEqual(try JSONDecoder().decode(TodoItem.self, from: data), task)
    }
}
