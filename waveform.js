/**
 * @fileoverview Functions for facilitating the creation of waveforms using the
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
 *
 * @author Daniel P. Seemuth
 * @version 0.1.0
 **/

var PROJ_NAME = 'Waveform Editor';
var VERSION = 'v0.1.0';

var rows = 0;
var cols = 0;
var table;


/**
 * Create a TextNode with the given string.
 * @param {string} str Text contents for new node.
 * @return {TextNode} Node containing str.
 */
function text(str)
{
    return document.createTextNode(str);
}


/**
 * Generate the default contents for a new cell.
 * @param {number} rowIndex Zero-based row index of the cell.
 * @param {number} colIndex Zero-based col index of the cell.
 * @return {string} Text contents for the cell.
 */
function cellContents(rowIndex, colIndex)
{
    return '&nbsp;';
}


/**
 * Add rows at the bottom of the waveform.
 * @param {number} numRows Number of rows to add.
 */
function addRows(numRows)
{
    numRows += rows;

    if (table.tBodies.length < 1) {
	table.appendChild(document.createElement('tbody'));
    }

    for (; rows < numRows; rows++) {
	table.tBodies[table.tBodies.length - 1].appendChild(text('\n'));
	var row = table.insertRow(-1);
	row.appendChild(text('\n'));

	for (c = 0; c < cols; c++) {
	    var cell = row.insertCell(-1);
	    cell.innerHTML = cellContents(rows, c);
	    row.appendChild(text('\n'));
	}
    }
}


/**
 * Delete rows from the bottom of the waveform.
 * @param {number} numRows Number of rows to delete.
 */
function delRows(numRows)
{
    numRows = rows - numRows;
    if (numRows < 1) {
	numRows = 1;
    }

    while (rows > numRows) {
	table.deleteRow(-1);
	rows--;
    }
}


/**
 * Add columns at the right end of the waveform.
 * @param {number} numCols Number of columns to add.
 */
function addCols(numCols)
{
    cols += numCols;

    for (r = 0; r < rows; r++) {
	var row = table.rows[r];

	for (c = row.cells.length; c < cols; c++) {
	    var cell = row.insertCell(-1);
	    cell.innerHTML = cellContents(r, c);
	    row.appendChild(text('\n'));
	}
    }
}


/**
 * Delete columns from the right end of the waveform.
 * @param {number} numCols Number of columns to delete.
 */
function delCols(numCols)
{
    cols = cols - numCols;
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




/**
 * Initialize the editor and waveform grid.
 */
function init()
{
    var version_paragraph = document.getElementById('version');

    version_paragraph.innerHTML = PROJ_NAME.concat(' ', VERSION);

    table = document.getElementById('wftable');
    addRows(4);
    addCols(10);
}


/**
 * Copy the table's HTML into the I/O textarea so the user can copy/paste.
 */
function exportHTML()
{
    var io = document.getElementById('io');
    io.value = table.innerHTML.trim();
}
