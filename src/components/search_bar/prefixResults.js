function fetchData() {
  fetch('api end point')
    .then(response => response.json())
    .then(data => {
      const tableBody = document.getElementById('data-body');
      data.forEach(row => {
        const tr = document.createElement('tr');
        const td1 = document.createElement('td');
        td1.textContent = row.countryCode;
        const td2 = document.createElement('td');
        td2.textContent = row.rpki;
        const td3 = document.createElement('td');
        td3.textContent = row.irr;
        const td4 = document.createElement('td');
        td4.textContent = row.delegatedStatus;
        tr.appendChild(td1);
        tr.appendChild(td2);
        tr.appendChild(td3);
        tr.appendChild(td4);
        tableBody.appendChild(tr);

      });
    });
}