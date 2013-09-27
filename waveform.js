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
var VERSION = 'v0.2.0';

var START_SIGNALS = 4;
var START_COLS = 8;

var signals = 0;
var cols = 0;
var table;


/**
 * @private
 * Create a TextNode with the given string.
 * @param {string} str Text contents for new node.
 * @return {TextNode} Node containing str.
 */
function text_(str)
{
    return document.createTextNode(str);
}


/**
 * @private
 * Generate the default contents for a new cell.
 * @param {number} rowIndex Zero-based table row index of the cell.
 * @param {number} colIndex Zero-based table col index of the cell.
 * @return {string} Text contents for the cell.
 */
function cellContents_(rowIndex, colIndex)
{
    if (rowIndex == 0) {
	/* Header row: show column index except for name column. */
	if (colIndex == 0) {
	    return '&nbsp;';
	} else {
	    return colIndex.toString();
	}

    } else if ((rowIndex % 2) == 1) {
	/* Separator row: blank cells. */
	return '&nbsp;';

    } else if (colIndex == 0) {
	/* Signal name column. */
	return 'SIG';

    }

    /* Signal data cell. */
    return Math.floor((Math.random() * 900) + 100).toString();
}


/**
 * @private
 * Set the event callbacks for a new cell.
 * @param {cell} cell Set callbacks for this cell.
 * @param {number} rowIndex Zero-based table row index of the cell.
 * @param {number} colIndex Zero-based table col index of the cell.
 */
function setCellEventCallbacks_(cell, rowIndex, colIndex)
{
    if (rowIndex == 0) {
	/* Header row. */

	if (colIndex > 0) {
	    cell.ondblclick = cell_dblclick;
	}

    } else if (((rowIndex - 1) % 2) == 1) {
	/* Signal row. */
	cell.ondblclick = cell_dblclick;
    }
}


/**
 * @private
 * Add table row at the given row index.
 * @param {number} rowIndex Add row at this index (0 <= rowIndex <= # rows).
 */
function addRow_(rowIndex)
{
    if (rowIndex < 0) {
	throw 'rowIndex too low';
    }

    var row = table.insertRow(rowIndex);
    row.appendChild(text_('\n'));

    /* Add newline before this row. */
    table.tBodies[0].insertBefore(text_('\n'), row);

    /* Add newline after this row. */
    var nextrow = row.nextSibling;
    if (nextrow == null) {
	table.tBodies[0].appendChild(text_('\n'));
    } else {
	table.tBodies[0].insertBefore(text_('\n'), nextrow);
    }

    /* Add columns. */
    for (var c = 0; c < cols; c++) {
	addCell_(rowIndex, c);
    }
}


/**
 * @private
 * Add table cell at the given row and column indices.
 * @param {number} rowIndex Add cell in this row (0 <= rowIndex < # rows).
 * @param {number} colIndex Add cell in this col (0 <= colIndex <= # cells).
 * @return {cell} Cell that was added to the table.
 */
function addCell_(rowIndex, colIndex)
{
    if (rowIndex < 0) {
	throw 'rowIndex too low';
    }

    if (colIndex < 0) {
	throw 'colIndex too low';
    }

    var row = table.rows[rowIndex];
    var cell = row.insertCell(colIndex);

    cell.innerHTML = cellContents_(rowIndex, colIndex);
    setCellEventCallbacks_(cell, rowIndex, colIndex);
    row.appendChild(text_('\n'));

    return cell;
}


/**
 * @private
 * Convert signal index to table row index.
 * @param {number} sigIndex Zero-based signal index.
 * @return {number} Zero-based table row index.
 */
function sigIndexToRowIndex_(sigIndex)
{
    if (sigIndex < 0) {
	throw 'sigIndex too low';
    }

    /* Row 0 is header row, and 2 rows per signal. */
    return 1 + (sigIndex * 2);
}


/**
 * @private
 * Convert table row index to signal index.
 * @param {number} rowIndex Zero-based table row index.
 * @return {number} Zero-based signal index.
 */
function rowIndexToSigIndex_(rowIndex)
{
    if (rowIndex < 1) {
	throw 'rowIndex too low';
    }

    /* Row 0 is header row, and 2 rows per signal. */
    return Math.floor((rowIndex - 1) / 2);
}


/**
 * Add signal at the given index.
 * @param {number} index Add signal at this index (negative means last).
 */
function addSignal(index)
{
    if (index < 0) {
	index = signals;
    }

    var rowIndex = sigIndexToRowIndex_(index);

    /* Add separator row and signal row. */
    for (var i = 0; i < 2; i++) {
	addRow_(rowIndex + i);
    }

    signals++;
}


/**
 * Delete the signal at the given index.
 * @param {number} index Delete signal at this index (negative means last).
 */
function delSignal(index)
{
    if (signals < 1) {
	/* No signals to delete! */
	return;
    }

    signals--;

    if (index < 0) {
	index = signals;
    }

    var rowIndex = sigIndexToRowIndex_(index);

    for (var i = 0; i < 2; i++) {
	table.deleteRow(rowIndex);
    }
}


/**
 * Add column at the given index.
 * @param {number} index Add column at this index (negative means last).
 */
function addCol(index)
{
    if (index > cols) {
	throw 'index too high';
    }

    if (index < 0) {
	index = cols;
    }

    var regenHeader = (index < cols);	/* Need to regenerate header? */

    var colIndex = index;

    for (var r = 0; r < table.rows.length; r++) {
	addCell_(r, colIndex);
    }

    cols++;

    if (regenHeader) {
	var row = table.rows[0];

	for (var c = 1; c < cols; c++) {
	    row.cells[c].innerHTML = cellContents_(0, c);
	}
    }
}


/**
 * Delete the column at the given index.
 * @param {number} index Delete column at this index (negative means last).
 */
function delCol(index)
{
    if (cols <= 1) {
	/* No non-name columns to delete! */
	return;
    }

    if (index >= cols) {
	throw 'index too high';
    }

    var regenHeader = (index < (cols - 1)); /* Need to regenerate header? */

    cols--;

    if (index < 0) {
	index = cols;
    }

    var colIndex = index;

    for (var r = 0; r < table.rows.length; r++) {
	var row = table.rows[r];

	row.deleteCell(colIndex);
    }

    if (regenHeader) {
	var row = table.rows[0];

	for (var c = 1; c < cols; c++) {
	    row.cells[c].innerHTML = cellContents_(0, c);
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


    /* Pre-populate the table. */

    if (table.tBodies.length < 1) {
	table.appendChild(document.createElement('tbody'));
    }

    for (var i = 0; i < START_COLS; i++) {
	addCol(-1);
    }

    /* Add header row. */
    addRow_(0);

    for (var i = 0; i < START_SIGNALS; i++) {
	addSignal(-1);
    }
}


/**
 * Copy the table's HTML into the I/O textarea so the user can copy/paste.
 */
function exportHTML()
{
    var io = document.getElementById('io');
    var text = table.innerHTML.trim().replace(/\n+/g, '\n');
    io.value = text;
}


/**
 * Handle double-click event on a cell.
 */
function cell_dblclick(event) {
    var cell = event.currentTarget;

    if (cell.style.backgroundColor == 'blue') {
	cell.style.backgroundColor = '';
    } else {
	cell.style.backgroundColor = 'blue';
    }
}
