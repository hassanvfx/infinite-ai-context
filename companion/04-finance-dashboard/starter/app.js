const categories = [
  { id: "home", name: "Home", planned: 1200 },
  { id: "food", name: "Food", planned: 450 },
  { id: "transport", name: "Transport", planned: 160 },
];

const transactions = [
  { categoryId: "home", amount: 1200, label: "Sample rent" },
  { categoryId: "food", amount: 78, label: "Sample groceries" },
  { categoryId: "food", amount: 21, label: "Sample lunch" },
];

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const spentFor = (categoryId) => transactions
  .filter((item) => item.categoryId === categoryId)
  .reduce((sum, item) => sum + item.amount, 0);
const details = categories.map((category) => ({ ...category, spent: spentFor(category.id) }))
  .map((category) => ({ ...category, remaining: category.planned - category.spent }));
const total = (key) => details.reduce((sum, category) => sum + category[key], 0);

document.querySelector("#summary").innerHTML = ["planned", "spent", "remaining"]
  .map((key) => `<div class="summary"><span class="label">Total ${key}</span><span class="amount">${money.format(total(key))}</span></div>`)
  .join("");
document.querySelector("#categories").innerHTML = `<div class="grid">${details.map((category) => `
  <article class="card"><h2>${category.name}</h2>
    <p class="label">Planned</p><p class="amount">${money.format(category.planned)}</p>
    <p class="label">Spent</p><p class="amount">${money.format(category.spent)}</p>
    <p class="label">Remaining</p><p class="amount ${category.remaining < 0 ? "over" : ""}">${money.format(category.remaining)}</p>
  </article>`).join("")}</div>`;
