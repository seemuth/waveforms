var rows = 0;
var cols = 10;
var table;
var edit_border = "thin dotted grey";

function text(str)
{
    return document.createTextNode(str);
}

function init()
{
    table = document.getElementById("wftable");
    addRows(4);
}

function addRows(numrows)
{
    numrows += rows;

    if (table.tBodies.length < 1) {
	table.appendChild(document.createElement('tbody'));
    }

    for (; rows < numrows; rows++) {
	table.tBodies[table.tBodies.length - 1].appendChild(text("\n"));
	var row = table.insertRow(-1);
	row.appendChild(text("\n"));

	for (c = 0; c < cols; c++) {
	    var cell = row.insertCell(-1);
	    cell.innerHTML = rows.toString().concat(",", c.toString());
	    cell.style.border = edit_border;
	    row.appendChild(text("\n"));
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
	    row.appendChild(text("\n"));
	}
    }
}
