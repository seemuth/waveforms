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
 * @version 0.3.3
 **/

var PROJ_NAME = 'Waveform Editor';
var VERSION = 'v0.3.3';

var START_SIGNALS = 4;
var START_COLS = 8;

var COLOR_SELECT = 'cyan';
var BORDER_SIGNAL = 'thick solid blue';
var MINWIDTH_SIGNAME = '100px';
var MINWIDTH_DATACOL = '20px';
var FONTSIZE_SIGNAME = 'medium';

var signals = 0;
var cols = 0;
var table;

var selected = [];

var state = 'MAIN';


var helper = {
    /**
     * Find an object within an array.
     * @param {array} arr Array to search.
     * @param {object} seek Object for which to search.
     * @return {number} Index of found object, or -1 if not found.
     */
    indexOf: function(arr, seek)
    {
	for (var i = 0; i < arr.length; i++) {
	    if (arr[i] === seek) {
		return i;
	    }
	}

	return -1;
    },


    /**
     * @private
     * Create a TextNode with the given string.
     * @param {string} str Text contents for new node.
     * @return {TextNode} Node containing str.
     */
    text_: function(str)
    {
	return document.createTextNode(str);
    },
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

	cell.onclick = cell_click;
	cell.ondblclick = cell_dblclick;

    } else if (((rowIndex - 1) % 2) == 1) {
	/* Signal row. */
	cell.onclick = cell_click;
	cell.ondblclick = cell_dblclick;

    } else {
	/* Spacing row. */
	cell.onclick = spacingCell_click;
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

    if (rowIndex == 0) {
	/* Header row: center time indices. */

	if (colIndex > 0) {
	    cell.style.textAlign = 'center';
	}

    } else if (((rowIndex - 1) % 2) == 1) {
	/* Signal row. */

	if (colIndex == 0) {
	    /* Signal name. */
	    cell.style.textAlign = 'right';
	    cell.style.fontSize = FONTSIZE_SIGNAME;
	}

	if (rowIndexToSigIndex_(rowIndex) == 0) {
	    /* First signal: set minimum column widths. */
	    if (colIndex == 0) {
		cell.style.minWidth = MINWIDTH_SIGNAME;
	    } else {
		cell.style.minWidth = MINWIDTH_DATACOL;
	    }
	}
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
    row.appendChild(helper.text_('\n'));

    /* Add newline before this row. */
    table.tBodies[0].insertBefore(helper.text_('\n'), row);

    /* Add newline after this row. */
    var nextrow = row.nextSibling;
    if (nextrow == null) {
	table.tBodies[0].appendChild(helper.text_('\n'));
    } else {
	table.tBodies[0].insertBefore(helper.text_('\n'), nextrow);
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

    row.appendChild(helper.text_('\n'));

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
    clearSelection();

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
    clearSelection();

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
    clearSelection();

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
    clearSelection();

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
function clearSelection()
{
    for (var i = 0; i < selected.length; i++) {
	var parts = selected[i].split('x');
	var rowIndex = parseInt(parts[0]);
	var colIndex = parseInt(parts[1]);
	var cell = tableCoordsToCell_(rowIndex, colIndex);

	cell.style.backgroundColor = '';
    }

    selected = [];
    enableSigEdit_(false);
}


/**
 * @private
 * Toggle cell selection.
 * @param {number} rowIndex Zero-based row index.
 * @param {number} colIndex Zero-based column index.
 * @param {string} mode Set/clear/toggle selection.
 */
function setCellSelection_(rowIndex, colIndex, mode)
{
    var cellKey = rowIndex.toString().concat('x', colIndex.toString());
    var index = helper.indexOf(selected, cellKey);
    var cell = tableCoordsToCell_(rowIndex, colIndex);

    var sel_set = false;
    var sel_clear = false;

    mode = mode.trim().charAt(0).toLowerCase();

    if (mode == 's') {
	sel_set = true;

    } else if (mode == 'c') {
	sel_clear = true;

    } else if (mode == 't') {
	sel_set = (index < 0);
	sel_clear = ! sel_set;

    } else {
	throw 'invalid mode';
    }


    if (sel_set) {
	/* Select this cell if it isn't already selected. */
	if (index < 0) {
	    selected.push(cellKey);

	    cell.style.backgroundColor = COLOR_SELECT;
	}
    }

    if (sel_clear) {
	/* Deselect this cell if it is selected. */
	if (index >= 0) {
	    selected.splice(index, 1);

	    cell.style.backgroundColor = '';
	}
    }

    enableSigEdit_(selected.length > 0);
}


/** @private
 * Update signal cell's entering edge (left border) as needed.
 * @param {number} rowIndex Zero-based row index.
 * @param {number} colIndex Zero-based column index.
 */
function updateCellEdge_(rowIndex, colIndex)
{
    if (colIndex <= 1) {
	/* First column has no entering edge. */
	return;

    } else if (colIndex >= cols) {
	/* Beyond the last column. */
	return;
    }

    var cell = tableCoordsToCell_(rowIndex, colIndex);
    var leftCell = tableCoordsToCell_(rowIndex, colIndex - 1);

    var dontcare = (cell.style.borderTop == '') &&
	(cell.style.borderBottom == '');
    dontcare |= (leftCell.style.borderTop == '') &&
	(leftCell.style.borderBottom == '');

    var edge = (cell.style.borderTop != leftCell.style.borderTop) ||
	(cell.style.borderBottom != leftCell.style.borderBottom);

    if (edge && (! dontcare)) {
	cell.style.borderLeft = BORDER_SIGNAL;
    } else {
	cell.style.borderLeft = '';
    }
}


/**
 * @private
 * Set signal cell's value.
 * @param {number} rowIndex Zero-based row index.
 * @param {number} colIndex Zero-based column index.
 * @param {string} mode Set/clear/toggle/dontcare value.
 */
function setCellValue_(rowIndex, colIndex, mode)
{
    var cell = tableCoordsToCell_(rowIndex, colIndex);

    mode = mode.trim().charAt(0).toLowerCase();

    if (mode == 's') {
	cell.style.borderTop = BORDER_SIGNAL;
	cell.style.borderBottom = '';

    } else if (mode == 'c') {
	cell.style.borderTop = '';
	cell.style.borderBottom = BORDER_SIGNAL;

    } else if (mode == 't') {
	var oldTop = cell.style.borderTop;
	var oldBottom = cell.style.borderBottom;

	cell.style.borderTop = oldBottom;
	cell.style.borderBottom = oldTop;

    } else if ((mode == 'd') || (mode == 'x')) {
	cell.style.borderTop = '';
	cell.style.borderBottom = '';

    } else {
	throw 'invalid mode';
    }

    /* Update entering and leaving edges. */
    updateCellEdge_(rowIndex, colIndex);
    updateCellEdge_(rowIndex, colIndex + 1);
}


/**
 * Set selected cells' values.
 * @param {string} mode Set/clear/toggle/dontcare values.
 */
function setSelectedCellValues(mode)
{
    for (var i = 0; i < selected.length; i++) {
	var parts = selected[i].split('x');
	var rowIndex = parseInt(parts[0]);
	var colIndex = parseInt(parts[1]);

	setCellValue_(rowIndex, colIndex, mode);
    }
}


/**
 * Overwrite message box.
 * @param {string} msg Set message box contents to this.
 */
function setMsg(msg)
{
    document.getElementById('msg').innerHTML = msg;
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
    clearSelection();

    var io = document.getElementById('io');
    var text = '<div style="overflow: auto">\n'.concat(
	    '<table cellspacing="0"',
	    ' style="border: none; border-collapse: collapse;">\n',
	    table.innerHTML.trim().replace(/\n+/g, '\n'),
	    '\n</table>',
	    '\n</div>'
	    );
    io.value = text;
}


/**
 * Set selected cells to 0.
 */
function sig0()
{
    setSelectedCellValues('clear');
}


/**
 * Set selected cells to 1.
 */
function sig1()
{
    setSelectedCellValues('set');
}


/**
 * Toggle selected cells' values.
 */
function sigInv()
{
    setSelectedCellValues('toggle');
}


/**
 * Set selected cells to X.
 */
function sigX()
{
    setSelectedCellValues('dontcare');
}


/**
 * Handle single-click event on a cell while in MAIN state.
 */
function cell_click_MAIN(event)
{
    var cell = event.currentTarget;
    var rowIndex = rowToRowIndex_(cell.parentNode);
    var colIndex = cellToColIndex_(cell);
    var modifier = (event.altKey || event.ctrlKey || event.shiftKey);

    if (! modifier) {
	/* Clear other selection and select the chosen cell(s). */
	clearSelection();
    }

    if ((colIndex == 0) && (rowIndex == 0)) {
	/* Select all. */
	for (var si = 0; si < signals; si++) {
	    var ri = sigIndexToRowIndex_(si) + 1;
	    for (var ci = 1; ci < cols; ci++) {
		setCellSelection_(ri, ci, 's');
	    }
	}

    } else if (colIndex == 0) {
	/* Select whole row. */

	for (var ci = 1; ci < cols; ci++) {
	    setCellSelection_(rowIndex, ci, 's');
	}

    } else if (rowIndex == 0) {
	/* Select whole column. */

	for (var si = 0; si < signals; si++) {
	    var ri = sigIndexToRowIndex_(si) + 1;
	    setCellSelection_(ri, colIndex, 's');
	}

    } else {
	/* Toggle this cell's selection. */
	setCellSelection_(rowIndex, colIndex, 't');
    }
}


/**
 * Handle single-click event on a cell while in ADDCOL/DELCOL state.
 */
function cell_click_COL(event)
{
    var cell = event.currentTarget;
    var colIndex = cellToColIndex_(cell);

    if (state == 'ADDCOL') {
	addCol(colIndex + 1);

    } else if (state == 'DELCOL') {
	if (colIndex > 0) {
	    delCol(colIndex);
	}

    }
}


/**
 * Handle single-click event on a cell.
 */
function cell_click(event)
{
    if (state == 'MAIN') {
	cell_click_MAIN(event);

    } else if ((state == 'ADDCOL') || (state == 'DELCOL')) {
	cell_click_COL(event);

    } else {
	setMsg('ERROR: Unknown state: '.concat(state))
    }
}


/**
 * Handle double-click event on a cell.
 */
function cell_dblclick(event)
{
    var cell = event.currentTarget;
    var rowIndex = rowToRowIndex_(cell.parentNode);
    var colIndex = cellToColIndex_(cell);

    if (colIndex == 0) {
	if (rowIndex > 0) {
	    /* Rename signal. */
	    var oldName = cell.innerHTML;

	    cell.innerHTML = '<input type="text" id="newName"'.concat(
		    ' value="',
		    oldName,
		    '" />'
		    );

	    var input = document.getElementById('newName');
	    input.onblur = newName_onblur;

	    cell.ondblclick = null;
	}
    }
}


/**
 * Handle click event on a spacing cell (between signal rows).
 */
function spacingCell_click(event)
{
    clearSelection();
}


/**
 * @private
 * Handle finish of editing signal name.
 * @param {string} newName New signal name.
 * @param {cell} cell Signal table cell.
 */
function newName_finish_(newName, cell)
{
    cell.innerHTML = escape(newName.trim()).replace(/%20/g, ' ');
    cell.ondblclick = cell_dblclick;
}


/**
 * Handle de-focus while editing signal name.
 */
function newName_onblur(event)
{
    var input = event.currentTarget;
    newName_finish_(input.value, input.parentNode);
}


/**
 * Handle request to add/delete column.
 * @param {string} op Operation ('add' or 'del').
 */
function reqAddDelCol(op)
{
    op = op.trim().charAt(0).toLowerCase();

    var nextState = 'MAIN';

    if (op == 'a') {
	nextState = 'ADDCOL';

	setMsg('Add a column after which column?');

    } else if (op == 'd') {
	nextState = 'DELCOL';

	setMsg('Delete which column?');

    } else {
	throw 'invalid operation';
    }

    clearSelection();

    if (state == nextState) {
	/* Finished with operation. */
	nextState = 'MAIN';
	setMsg('');
    }

    state = nextState;
}
