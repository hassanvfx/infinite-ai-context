import Foundation
import Combine

final class TodoStore: ObservableObject {
    @Published private(set) var tasks: [TodoItem]
    private let defaults: UserDefaults
    private let key = "clineflow.swift-todo-lab.tasks"

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        guard let data = defaults.data(forKey: key), let saved = try? JSONDecoder().decode([TodoItem].self, from: data) else {
            tasks = []
            return
        }
        tasks = saved
    }

    func add(title: String) {
        let trimmed = title.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        tasks.append(TodoItem(title: trimmed))
        save()
    }

    func toggle(_ task: TodoItem) {
        guard let index = tasks.firstIndex(of: task) else { return }
        tasks[index].completed.toggle()
        save()
    }

    func delete(_ task: TodoItem) {
        tasks.removeAll { $0.id == task.id }
        save()
    }

    private func save() {
        guard let data = try? JSONEncoder().encode(tasks) else { return }
        defaults.set(data, forKey: key)
    }
}
