document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const file = document.getElementById("fileInput").files[0];
  if (!file) return alert("Selecciona un archivo");

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("http://localhost:3001/upload", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  document.getElementById("result").innerText = JSON.stringify(data, null, 2);
});
