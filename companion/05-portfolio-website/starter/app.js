const projects = [
  { title: "Finance Dashboard Lab", role: "Designer and builder", outcome: "A local learning demo using fictional data." },
  { title: "Portfolio Website Lab", role: "Author", outcome: "A responsive static presentation with approved content." },
];
document.querySelector("#projects").innerHTML = projects.map((project) => `<article><h3>${project.title}</h3><p><strong>Role:</strong> ${project.role}</p><p>${project.outcome}</p></article>`).join("");
