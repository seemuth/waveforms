var rows = 0;
var cols = 10;
var table;
var edit_border = "thin dotted grey";

function init()
{
    table = document.getElementById("wftable");
    addRows(4);
}

function addRows(numrows)
{
    numrows += rows;

    for (; rows < numrows; rows++) {
	var row = table.insertRow(-1);

	for (c = 0; c < cols; c++) {
	    var cell = row.insertCell(-1);
	    cell.innerHTML = rows.toString().concat(",", c.toString());
	    cell.style.border = edit_border;
	    row.appendChild(document.createTextNode("\n"));
	}
    }
}

function addCols(numcols)
{
    cols += numcols;

    for (r = 0; r < rows; r++) {
	var row = table.rows[r];

	for (c = row.cells.length; c < cols; c++) {
	    var cell = row.insertCell(-1);
	    cell.innerHTML = r.toString().concat(",", c.toString());
	    cell.style.border = edit_border;
	    row.appendChild(document.createTextNode("\n"));
	}
    }
}
