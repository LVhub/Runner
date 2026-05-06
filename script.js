const fs = require('fs');
const csv = require('csv-parser');

const FILE_NAME = 'COPY NJT Scheduled Orders March 30-31.csv';
const SKIP = 72183;

const rows = [];
let count = 0;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

fs.createReadStream(FILE_NAME)
  .pipe(csv())
  .on('data', (row) => {
    count++;

    if (count <= SKIP) return;

    rows.push(row);
  })
  .on('end', async () => {

    console.log(`Processing ${rows.length} rows...`);

    let success = 0;
    let failed = 0;

    for (const row of rows) {

      // CSV column names
      const saleOrder = row["Sale_Order"];
      const itemId = row["Item_ID"];

      const body = {
        consignment_number: saleOrder,
        package_id: itemId,
        package_status: "Order Received At Destination Hub"
      };

      try {

        const res = await fetch(
          'https://api-uat.fareyeconnect.com/setu/amhome/v1/receive-status',
          {
            method: 'POST',
            headers: {
              'User-Agent': 'Mozilla/5.0',
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': 'Bearer 3069436e-0192-4fa2-87ff-cba1a0f788b3'
            },
            body: JSON.stringify(body)
          }
        );

        if (res.ok) {
          success++;
          console.log(`SUCCESS -> Sale_Order: ${saleOrder}, Item_ID: ${itemId}`);
        } else {
          failed++;

          const errorText = await res.text();

          console.log(
            `FAILED -> Sale_Order: ${saleOrder}, Item_ID: ${itemId}`
          );

          console.log(errorText);
        }

      } catch (err) {

        failed++;

        console.log(
          `ERROR -> Sale_Order: ${saleOrder}, Item_ID: ${itemId}`
        );

        console.log(err.message);
      }

      // delay between requests
      await sleep(100);
    }

    console.log('\n===== SUMMARY =====');
    console.log(`Success: ${success}`);
    console.log(`Failed: ${failed}`);
    console.log('Done 🚀');

  });
