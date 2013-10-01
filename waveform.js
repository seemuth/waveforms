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

var COLOR_SELECT = 'cyan';

var signals = 0;
var cols = 0;
var table;

var selected = [];


/**
 * Find an object within an array.
 * @param {array} arr Array to search.
 * @param {object} seek Object for which to search.
 * @return {number} Index of found object, or -1 if not found.
 */
function indexOf(arr, seek)
{
    for (var i = 0; i < arr.length; i++) {
	if (arr[i] === seek) {
	    return i;
	}
    }

    return -1;
}


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
    return '&nbsp;';
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
	    cell.onclick = cell_click;
	    cell.ondblclick = cell_dblclick;
	}

    } else if (((rowIndex - 1) % 2) == 1) {
	/* Signal row. */
	cell.onclick = cell_click;
	cell.ondblclick = cell_dblclick;
    }
}


/**
 * @private
 * Set up a new cell (contents, callbacks, style, etc.).
 * @param {cell} cell Set callbacks for this cell.
 * @param {number} rowIndex Zero-based table row index of the cell.
 * @param {number} colIndex Zero-based table col index of the cell.
 */
function setUpCell_(cell, rowIndex, colIndex)
{
    cell.innerHTML = cellContents_(rowIndex, colIndex);

    setCellEventCallbacks_(cell, rowIndex, colIndex);

    cell.style.borderRight = 'thin dotted black';
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

    setUpCell_(cell, rowIndex, colIndex);

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
 * @private
 * Find the column index for a cell object.
 * @param {cell} cell Cell whose index to find.
 * @return {number} Zero-based column index.
 */
function cellToColIndex_(cell)
{
    var parent_row = cell.parentNode;

    for (var i = 0; i < parent_row.cells.length; i++) {
	if (cell === parent_row.cells[i]) {
	    return i;
	}
    }
    return -1;
}


/**
 * @private
 * Find the row index for a row object.
 * @param {row} row Row whose index to find.
 * @return {number} Zero-based row index.
 */
function rowToRowIndex_(row)
{
    var parent_table = row.parentNode;

    for (var i = 0; i < parent_table.rows.length; i++) {
	if (row === parent_table.rows[i]) {
	    return i;
	}
    }
    return -1;
}


/**
 * @private
 * Find the cell at the given table coordinates.
 * @param {number} rowIndex Zero-based row index.
 * @param {number} colIndex Zero-based column index.
 * @return {cell} Cell at the given coordinates.
 */
function tableCoordsToCell_(rowIndex, colIndex)
{
    return table.rows[rowIndex].cells[colIndex];
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
 * @private
 * Enable/show or disable/hide signal editing buttons.
 * @param {bool} enable True to enable, false to disable.
 */
function enableSigEdit_(enable)
{
    var sigEdit = document.getElementById('sigEdit');

    for (var i = 0; i < sigEdit.childNodes.length; i++) {
	var n = sigEdit.childNodes[i];

	if (n.nodeName.toLowerCase() == 'button') {
	    n.disabled = ! enable;
	}
    }

    sigEdit.style.visibility = (enable) ? 'visible' : 'hidden';
}


/**
 * Clear selection and unhighlight cells.
 */
function clearSelection_()
{
    for (var i = 0; i < selected.length; i++) {
	var parts = selected[i].split('x');
	var rowIndex = new Number(parts[0]);
	var colIndex = new Number(parts[1]);
	var cell = tableCoordsToCell_(rowIndex, colIndex);

	cell.style.backgroundColor = '';
    }

    selected = [];
}


/**
 * @private
 * Toggle cell selection.
 * @param {cell} cell Select/deselect this cell.
 */
function toggleCellSelection_(cell)
{
    var rowIndex = rowToRowIndex_(cell.parentNode);
    var colIndex = cellToColIndex_(cell);
    var cellKey = rowIndex.toString().concat('x', colIndex.toString());

    var index = indexOf(selected, cellKey);

    if (index < 0) {
	/* Select this cell. */
	selected.push(cellKey);

	cell.style.backgroundColor = COLOR_SELECT;

    } else {
	/* Deselect this cell. */
	selected.splice(index, 1);

	cell.style.backgroundColor = '';
    }

    enableSigEdit_(selected.length > 0);
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
 * Handle single-click event on a cell.
 */
function cell_click(event)
{
    var cell = event.currentTarget;
    var rowIndex = rowToRowIndex_(cell.parentNode);
    var colIndex = cellToColIndex_(cell);
    var modifier = (event.altKey || event.ctrlKey || event.shiftKey);

    if ((colIndex > 0) && (rowIndex > 0)) {
	/* Signal data cell. */

	if (! modifier) {
	    /* Clear other selection and select this cell. */
	    clearSelection_();
	}

	/* Toggle this cell's selection. */
	toggleCellSelection_(cell);
    }
}


/**
 * Handle double-click event on a cell.
 */
function cell_dblclick(event)
{
    var cell = event.currentTarget;

    if (cell.style.backgroundColor == 'blue') {
	cell.style.backgroundColor = '';
    } else {
	cell.style.backgroundColor = 'blue';
    }
}
