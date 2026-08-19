import SwiftUI

struct ContentView: View {
    @StateObject private var store = TodoStore()
    @State private var title = ""

    var body: some View {
        NavigationStack {
            List {
                Section("Add a fictional task") {
                    TextField("New task", text: $title)
                    Button("Add task") { store.add(title: title); title = "" }
                }
                if store.tasks.isEmpty {
                    Text("No tasks yet. Add a fictional example.")
                } else {
                    ForEach(store.tasks) { task in
                        HStack {
                            Button(task.completed ? "Mark incomplete" : "Mark complete") { store.toggle(task) }
                            Text(task.title).strikethrough(task.completed)
                            Spacer()
                            Button("Delete \(task.title)", role: .destructive) { store.delete(task) }
                        }
                    }
                }
            }
            .navigationTitle("Local Todo Lab")
        }
    }
}
