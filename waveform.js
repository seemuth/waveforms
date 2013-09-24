var rows = 0;
var cols = 0;
var table;
var edit_border = "thin dotted lightgrey";

function text(str)
{
    return document.createTextNode(str);
}

function cellContents(rowindex, colindex)
{
    return "&nbsp;";
}

function init()
{
    table = document.getElementById("wftable");
    addRows(4);
    addCols(10);
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
	    cell.innerHTML = cellContents(rows, c);
	    cell.style.border = edit_border;
	    row.appendChild(text("\n"));
	}
    }
}

function delRows(numrows)
{
    numrows = rows - numrows;
    if (numrows < 1) {
	numrows = 1;
    }

    while (rows > numrows) {
	table.deleteRow(-1);
	rows--;
    }
}

function addCols(numcols)
{
    cols += numcols;

    for (r = 0; r < rows; r++) {
	var row = table.rows[r];

	for (c = row.cells.length; c < cols; c++) {
	    var cell = row.insertCell(-1);
	    cell.innerHTML = cellContents(r, c);
	    cell.style.border = edit_border;
	    row.appendChild(text("\n"));
	}
    }
}

function delCols(numcols)
{
    cols = cols - numcols;
    if (cols < 1) {
	cols = 1;
    }

    for (r = 0; r < rows; r++) {
	var row = table.rows[r];

	while (row.cells.length > cols) {
	    row.deleteCell(-1);
	}
    }
}
