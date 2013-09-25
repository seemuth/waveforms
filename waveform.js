/**
 * waveform.js: Functions for facilitating the creation of waveforms using the
 *	accompanying waveform.html file.
 *
 * Copyright (c) 2013 Daniel P. Seemuth
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 **/
var rows = 0;
var cols = 0;
var table;

function text(str)
{
    return document.createTextNode(str);
}

function cellContents(rowindex, colindex)
{
    return "&nbsp;";
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



function init()
{
    table = document.getElementById("wftable");
    addRows(4);
    addCols(10);
}

function exportHTML()
{
    var io = document.getElementById("io");
    io.value = table.innerHTML.trim();
}
