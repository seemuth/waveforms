/**
 * @fileoverview Functions for facilitating the creation of waveforms using
 * the accompanying waveform.html file.
 *
 * Copyright (c) 2013 Daniel P. Seemuth
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 * @author Daniel P. Seemuth
 * @version 0.4.1
 **/

var PROJ_NAME = 'Waveform Editor';
var VERSION = 'v0.4.1';

var START_SIGNALS = 4;
var START_COLS = 8;

var COLOR_SELECT = 'cyan';
var BORDER_SIGNAL = 'thick solid blue';
var MINWIDTH_SIGNAME = '100px';
var MINWIDTH_DATACOL = '20px';
var FONTSIZE_SIGNAME = 'medium';

var signals = 0;
var cols = 1;   /* Always have zeroth column (don't-care) */
var table;

var data = [];

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


var dataOps = {
    /**
     * @private
     * Insert data cell at the specified position.
     * @param {number} sigIndex Zero-based signal index.
     * @param {number} cellIndex Zero-based cell index.
     * @param {string} [opt_value='x'] Use 0/1/x value or copy from previous
     *	    (left) cell value.
     */
    addCell_: function(sigIndex, cellIndex, opt_value)
    {
	var mode;
	var value;

	if (sigIndex < 0) {
	    throw 'sigIndex too low';
	} else if (sigIndex >= signals) {
	    throw 'sigIndex too high';
	}

	if (cellIndex < 1) {
	    throw 'cellIndex too low';
	} else if (cellIndex > (cols + 1)) {
	    throw 'cellIndex too high';
	}


	if (opt_value === undefined) {
	    mode = 'x';
	} else {
	    mode = opt_value.toString().trim().charAt(0).toLowerCase();
	}

	if ((mode == '0') || (mode == '1') || (mode == 'x')) {
	    value = mode;

	} else if ((mode == 'c') || (mode == 'p')) {
	    value = data[sigIndex][cellIndex - 1];

	} else {
	    throw 'Invalid value';
	}

	data[sigIndex].splice(cellIndex, 0, value);
    },


    /**
     * @private
     * Delete data cell at the specified position.
     * @param {number} sigIndex Zero-based signal index.
     * @param {number} cellIndex Zero-based cell index.
     */
    delCell_: function(sigIndex, cellIndex)
    {
	if (sigIndex < 0) {
	    throw 'sigIndex too low';
	} else if (sigIndex >= signals) {
	    throw 'sigIndex too high';
	}

	if (cellIndex < 1) {
	    throw 'cellIndex too low';
	} else if (cellIndex > cols) {
	    throw 'cellIndex too high';
	}

	data[sigIndex].splice(cellIndex, 1);
    },


    /**
     * @private
     * Add data column at the specified position for all signals.
     * @param {number} colIndex Zero-based column index.
     * @param {string} [opt_value='x'] Use 0/1/x value or copy from previous
     *	    (left) cell value.
     */
    addCol_: function(colIndex, opt_value)
    {
	if (colIndex < 1) {
	    throw 'colIndex too low';
	} else if (colIndex > (cols + 1)) {
	    throw 'colIndex too high';
	}

	for (var sigIndex = 0; sigIndex < signals; sigIndex++) {
	    dataOps.addCell_(sigIndex, colIndex, opt_value);
	}

	cols++;
    },


    /**
     * @private
     * Delete data column at the specified position for all signals.
     * @param {number} colIndex Zero-based column index.
     */
    delCol_: function(colIndex)
    {
	if (colIndex < 1) {
	    throw 'colIndex too low';
	} else if (colIndex > cols) {
	    throw 'colIndex too high';
	}

	for (var sigIndex = 0; sigIndex < signals; sigIndex++) {
	    dataOps.delCell_(sigIndex, colIndex);
	}

	cols--;
    },


    /**
     * @private
     * Add signal data row at the specified position.
     * @param {number} sigIndex Zero-based signal index.
     * @param {string} [opt_value='x'] Use 0/1/x value for all data cells.
     */
    addSignal_: function(sigIndex, opt_value)
    {
	var mode;
	var values = [];

	if (sigIndex < 0) {
	    throw 'sigIndex too low';
	} else if (sigIndex > signals) {
	    throw 'sigIndex too high';
	}

	if (opt_value === undefined) {
	    mode = 'x';
	} else {
	    mode = opt_value.toString().trim().charAt(0).toLowerCase();
	}

	if ((mode == '0') || (mode == '1') || (mode == 'x')) {
	    for (var i = 0; i < (cols + 1); i++) {
		values.push(mode);
	    }

	} else {
	    throw 'Invalid value';
	}

	data.splice(sigIndex, 0, values);

	signals++;
    },


    /**
     * @private
     * Delete signal data row at the specified position.
     * @param {number} sigIndex Zero-based signal index.
     */
    delSignal_: function(sigIndex)
    {
	if (sigIndex < 0) {
	    throw 'sigIndex too low';
	} else if (sigIndex >= signals) {
	    throw 'sigIndex too high';
	}

	data.splice(sigIndex, 1);

	signals--;
    },
}


var cellOps = {
    /**
     * @private
     * Generate the default contents for a new cell.
     * @param {number} rowIndex Zero-based table row index of the cell.
     * @param {number} colIndex Zero-based table col index of the cell.
     * @return {string} Text contents for the cell.
     */
    cellContents_: function(rowIndex, colIndex)
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
    },


    /**
     * @private
     * Set the event callbacks for a new cell.
     * @param {cell} cell Set callbacks for this cell.
     * @param {number} rowIndex Zero-based table row index of the cell.
     * @param {number} colIndex Zero-based table col index of the cell.
     */
    setCellEventCallbacks_: function(cell, rowIndex, colIndex)
    {
	if (rowIndex == 0) {
	    /* Header row. */

	    cell.onclick = eventOps.cell_click;
	    cell.ondblclick = eventOps.cell_dblclick;

	} else if (((rowIndex - 1) % 2) == 1) {
	    /* Signal row. */
	    cell.onclick = eventOps.cell_click;
	    cell.ondblclick = eventOps.cell_dblclick;

	} else {
	    /* Spacing row. */
	    cell.onclick = eventOps.spacingCell_click;
	}
    },


    /**
     * @private
     * Set up a new cell (contents, callbacks, style, etc.).
     * @param {cell} cell Set callbacks for this cell.
     * @param {number} rowIndex Zero-based table row index of the cell.
     * @param {number} colIndex Zero-based table col index of the cell.
     */
    setUpCell_: function(cell, rowIndex, colIndex)
    {
	cell.innerHTML = cellOps.cellContents_(rowIndex, colIndex);

	cellOps.setCellEventCallbacks_(cell, rowIndex, colIndex);

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

	    if (indexOps.rowToSig_(rowIndex) == 0) {
		/* First signal: set minimum column widths. */
		if (colIndex == 0) {
		    cell.style.minWidth = MINWIDTH_SIGNAME;
		} else {
		    cell.style.minWidth = MINWIDTH_DATACOL;
		}
	    }
	}
    },
}


var tableOps = {
    /**
     * @private
     * Find the column index for a cell object.
     * @param {cell} cell Cell whose index to find.
     * @return {number} Zero-based column index.
     */
    cellToColIndex_: function(cell)
    {
	var parent_row = cell.parentNode;

	for (var i = 0; i < parent_row.cells.length; i++) {
	    if (cell === parent_row.cells[i]) {
		return i;
	    }
	}
	return -1;
    },


    /**
     * @private
     * Find the row index for a row object.
     * @param {row} row Row whose index to find.
     * @return {number} Zero-based row index.
     */
    rowToRowIndex_: function(row)
    {
	var parent_table = row.parentNode;

	for (var i = 0; i < parent_table.rows.length; i++) {
	    if (row === parent_table.rows[i]) {
		return i;
	    }
	}
	return -1;
    },


    /**
     * @private
     * Add table row at the given row index.
     * @param {number} rowIndex Add row at this index
     *	    (0 <= rowIndex <= # rows).
     */
    addRow_: function(rowIndex)
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
	    tableOps.addCell_(rowIndex, c);
	}
    },


    /**
     * @private
     * Add table cell at the given row and column indices.
     * @param {number} rowIndex Add cell in this row
     *	    (0 <= rowIndex < # rows).
     * @param {number} colIndex Add cell in this col
     *	    (0 <= colIndex <= # cells).
     * @return {cell} Cell that was added to the table.
     */
    addCell_: function(rowIndex, colIndex)
    {
	if (rowIndex < 0) {
	    throw 'rowIndex too low';
	}

	if (colIndex < 0) {
	    throw 'colIndex too low';
	}

	var row = table.rows[rowIndex];
	var cell = row.insertCell(colIndex);

	cellOps.setUpCell_(cell, rowIndex, colIndex);

	row.appendChild(helper.text_('\n'));

	return cell;
    },


    /**
     * @private
     * Find the cell at the given table coordinates.
     * @param {number} rowIndex Zero-based row index.
     * @param {number} colIndex Zero-based column index.
     * @return {cell} Cell at the given coordinates.
     */
    coordsToCell_: function(rowIndex, colIndex)
    {
	return table.rows[rowIndex].cells[colIndex];
    },


    /**
     * @private
     * Add signal at the given index.
     * @param {number} index Add signal at this index (<0 means last).
     */
    addSignal_: function(index)
    {
	selOps.clearSelection();

	if (index < 0) {
	    index = signals;
	}

	var rowIndex = indexOps.sigToRow_(index);

	/* Add separator row and signal row. */
	for (var i = 0; i < 2; i++) {
	    tableOps.addRow_(rowIndex + i);
	}
    },


    /**
     * @private
     * Delete the signal at the given index.
     * @param {number} index Delete signal at this index (<0 means last).
     */
    delSignal_: function(index)
    {
	selOps.clearSelection();

	if (signals < 1) {
	    /* No signals to delete! */
	    return;
	}

	if (index < 0) {
	    index = signals - 1;
	}

	var rowIndex = indexOps.sigToRow_(index);

	for (var i = 0; i < 2; i++) {
	    table.deleteRow(rowIndex);
	}
    },


    /**
     * @private
     * Add column at the given index.
     * @param {number} index Add column at this index (<0 means last).
     */
    addCol_: function(index)
    {
	selOps.clearSelection();

	if (index > cols) {
	    throw 'index too high';
	}

	if (index < 0) {
	    index = cols;
	}

	/* Need to regenerate header? */
	var regenHeader = (index < cols);

	var colIndex = index;

	for (var r = 0; r < table.rows.length; r++) {
	    tableOps.addCell_(r, colIndex);
	}

	if (regenHeader) {
	    var row = table.rows[0];

	    for (var c = 1; c < cols; c++) {
		row.cells[c].innerHTML = cellOps.cellContents_(0, c);
	    }
	}
    },


    /**
     * @private
     * Delete the column at the given index.
     * @param {number} index Delete column at this index (<0 means last).
     */
    delCol_: function(index)
    {
	selOps.clearSelection();

	if (cols <= 1) {
	    /* No non-name columns to delete! */
	    return;
	}

	if (index >= cols) {
	    throw 'index too high';
	}

	/* Need to regenerate header? */
	var regenHeader = (index < (cols - 1));

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
		row.cells[c].innerHTML = cellOps.cellContents_(0, c);
	    }
	}
    },


    /** @private
     * Update signal cell's entering edge (left border) as needed.
     * @param {number} rowIndex Zero-based row index.
     * @param {number} colIndex Zero-based column index.
     */
    updateCellEdge_: function(rowIndex, colIndex)
    {
	if (colIndex <= 1) {
	    /* First column has no entering edge. */
	    return;

	} else if (colIndex >= cols) {
	    /* Beyond the last column. */
	    return;
	}

	var cell = tableOps.coordsToCell_(rowIndex, colIndex);
	var leftCell = tableOps.coordsToCell_(rowIndex, colIndex - 1);

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
    },


    /**
     * @private
     * Set signal cell's value.
     * @param {number} rowIndex Zero-based row index.
     * @param {number} colIndex Zero-based column index.
     * @param {string} mode Set/clear/toggle/dontcare value.
     */
    setCellValue_: function(rowIndex, colIndex, mode)
    {
	var cell = tableOps.coordsToCell_(rowIndex, colIndex);

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
	tableOps.updateCellEdge_(rowIndex, colIndex);
	tableOps.updateCellEdge_(rowIndex, colIndex + 1);
    },
}


var indexOps = {
    /**
     * @private
     * Convert signal index to table row index.
     * @param {number} sigIndex Zero-based signal index.
     * @return {number} Zero-based table row index.
     */
    sigToRow_: function(sigIndex)
    {
	if (sigIndex < 0) {
	    throw 'sigIndex too low';
	}

	/* Row 0 is header row, and 2 rows per signal. */
	return 1 + (sigIndex * 2);
    },


    /**
     * @private
     * Convert table row index to signal index.
     * @param {number} rowIndex Zero-based table row index.
     * @return {number} Zero-based signal index.
     */
    rowToSig_: function(rowIndex)
    {
	if (rowIndex < 1) {
	    throw 'rowIndex too low';
	}

	/* Row 0 is header row, and 2 rows per signal. */
	return Math.floor((rowIndex - 1) / 2);
    },
}


var selOps = {
    /**
     * Clear selection and unhighlight cells.
     */
    clearSelection: function()
    {
	for (var i = 0; i < selected.length; i++) {
	    var parts = selected[i].split('x');
	    var rowIndex = parseInt(parts[0]);
	    var colIndex = parseInt(parts[1]);
	    var cell = tableOps.coordsToCell_(rowIndex, colIndex);

	    cell.style.backgroundColor = '';
	}

	selected = [];
	uiOps.enableSigEdit_(false);
    },


    /**
     * @private
     * Toggle cell selection.
     * @param {number} rowIndex Zero-based row index.
     * @param {number} colIndex Zero-based column index.
     * @param {string} mode Set/clear/toggle selection.
     */
    setCellSelection_: function(rowIndex, colIndex, mode)
    {
	var cellKey = rowIndex.toString().concat('x', colIndex.toString());
	var index = helper.indexOf(selected, cellKey);
	var cell = tableOps.coordsToCell_(rowIndex, colIndex);

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

	uiOps.enableSigEdit_(selected.length > 0);
    },


    /**
     * Set selected cells' values.
     * @param {string} mode Set/clear/toggle/dontcare values.
     */
    setSelectedCellValues: function(mode)
    {
	for (var i = 0; i < selected.length; i++) {
	    var parts = selected[i].split('x');
	    var rowIndex = parseInt(parts[0]);
	    var colIndex = parseInt(parts[1]);

	    tableOps.setCellValue_(rowIndex, colIndex, mode);
	}
    },


    /**
     * Set selected cells to 0.
     */
    sig0: function()
    {
	selOps.setSelectedCellValues('clear');
    },


    /**
     * Set selected cells to 1.
     */
    sig1: function()
    {
	selOps.setSelectedCellValues('set');
    },


    /**
     * Toggle selected cells' values.
     */
    sigInv: function()
    {
	selOps.setSelectedCellValues('toggle');
    },


    /**
     * Set selected cells to X.
     */
    sigX: function()
    {
	selOps.setSelectedCellValues('dontcare');
    },
}


var uiOps = {
    /**
     * @private
     * Enable/show or disable/hide signal editing buttons.
     * @param {bool} enable True to enable, false to disable.
     */
    enableSigEdit_: function(enable)
    {
	var sigEdit = document.getElementById('sigEdit');

	for (var i = 0; i < sigEdit.childNodes.length; i++) {
	    var n = sigEdit.childNodes[i];

	    if (n.nodeName.toLowerCase() == 'button') {
		n.disabled = ! enable;
	    }
	}

	sigEdit.style.visibility = (enable) ? 'visible' : 'hidden';
    },


    /**
     * Overwrite message box.
     * @param {string} msg Set message box contents to this.
     */
    setMsg: function(msg)
    {
	document.getElementById('msg').innerHTML = msg;
    },


    /**
     * Add signal at the given index.
     * @param {number} index Add signal at this index (<0 means last).
     * @param {string} [opt_value='x'] Use 0/1/x value for all data cells.
     */
    addSignal: function(index, opt_value)
    {
	selOps.clearSelection();

	if (index < 0) {
	    index = signals;
	}

	dataOps.addSignal_(index, opt_value);
        tableOps.addSignal_(index);

        uiOps.updateDisplayedCells(index, index, 0, -1);
    },


    /**
     * Delete the signal at the given index.
     * @param {number} index Delete signal at this index (<0 means last).
     */
    delSignal: function(index)
    {
	selOps.clearSelection();

	if (signals < 1) {
	    /* No signals to delete! */
	    return;
	}

	if (index < 0) {
	    index = signals - 1;
	}

	dataOps.delSignal_(index);
        tableOps.delSignal_(index);
    },


    /**
     * Add column at the given index.
     * @param {number} index Add column at this index (<0 means last).
     * @param {string} [opt_value='x'] Use 0/1/x value for all data cells.
     */
    addCol: function(index, opt_value)
    {
	selOps.clearSelection();

	if (index > cols) {
	    throw 'index too high';
	}

	if (index < 0) {
	    index = cols;
	}

        dataOps.addCol_(index, opt_value);
        tableOps.addCol_(index);

        uiOps.updateDisplayedCells(0, -1, index, index);
    },


    /**
     * Delete the column at the given index.
     * @param {number} index Delete column at this index (<0 means last).
     */
    delCol: function(index)
    {
	selOps.clearSelection();

	if (cols <= 1) {
	    /* No non-name columns to delete! */
	    return;
	}

	if (index >= cols) {
	    throw 'index too high';
	}

        dataOps.delCol_(index);
        tableOps.delCol_(index);
    },


    /**
     * Update the displayed table with the internally-stored data.
     */
    updateDisplayedData: function()
    {
        tableOps.updateHeader();
        uiOps.updateDisplayedCells(0, -1, 0, -1);
    },


    /**
     * Update specific cells in the displayed table from the
     * internally-stored data.
     * Note that column 0 is always x (don't-care) and is not displayed.
     * @param {number} sigMin Zero-based starting signal index (inclusive)
     * @param {number} sigMax Zero-based ending signal index (inclusive)
     * @param {number} colMin Zero-based starting column index (inclusive)
     * @param {number} colMax Zero-based ending column index (inclusive)
     */
    updateDisplayedCells: function(sigMin, sigMax, colMin, colMax)
    {
        if (sigMax < 0) {
            sigMax = signals - 1;
        }
        if (colMin < 1) {
            colMin = 1;
        }
        if (colMax < 0) {
            colMax = cols - 1;
        }

        for (var sigIndex = sigMin; sigIndex <= sigMax; sigIndex++) {
            for (var colIndex = colMin; colIndex <= colMax; colIndex++) {
                var dataVal = data[sigIndex][colIndex];
                var tableMode = null;

                if ((dataVal == '0') || (dataVal == 0)) {
                    tableMode = 'clear';

                } else if ((dataVal == '1') || (dataVal == 1)) {
                    tableMode = 'set';

                } else if (dataVal == 'x') {
                    tableMode = 'x';

                } else {
                    throw ('invalid data ' +
                            sigIndex.toString() +
                            ', ' +
                            colIndex.toString() +
                            ': ' +
                            dataVal.toString()
                          )
                }

                var rowIndex = indexOps.sigToRow_(sigIndex);
                tableOps.setCellValue_(rowIndex, colIndex, tableMode);
            }
        }
    },
}


var exportOps = {
    /**
     * Copy the table's HTML into the I/O textarea so the user can copy/paste.
     */
    showHTML: function()
    {
	selOps.clearSelection();

	var io = document.getElementById('io');
	var text = '<div style="overflow: auto">\n'.concat(
		'<table cellspacing="0"',
		' style="border: none; border-collapse: collapse;">\n',
		table.innerHTML.trim().replace(/\n+/g, '\n'),
		'\n</table>',
		'\n</div>'
		);
	io.value = text;
    },
}




var eventOps = {
    /**
     * Initialize the editor and waveform grid.
     */
    init: function()
    {
	var version_paragraph = document.getElementById('version');

	version_paragraph.innerHTML = PROJ_NAME.concat(' ', VERSION);

	table = document.getElementById('wftable');


	/* Pre-populate the table. */

	if (table.tBodies.length < 1) {
	    table.appendChild(document.createElement('tbody'));
	}

	/* Add header row. */
	tableOps.addRow_(0);

	for (var i = 0; i < START_COLS; i++) {
	    uiOps.addCol(-1);
	}

	for (var i = 0; i < START_SIGNALS; i++) {
	    uiOps.addSignal(-1);
	}
    },


    /**
     * Handle single-click event on a cell while in MAIN state.
     */
    cell_click_MAIN: function(event)
    {
	var cell = event.currentTarget;
	var rowIndex = tableOps.rowToRowIndex_(cell.parentNode);
	var colIndex = tableOps.cellToColIndex_(cell);
	var modifier = (event.altKey || event.ctrlKey || event.shiftKey);

	if (! modifier) {
	    /* Clear other selection and select the chosen cell(s). */
	    selOps.clearSelection();
	}

	if ((colIndex == 0) && (rowIndex == 0)) {
	    /* Select all. */
	    for (var si = 0; si < signals; si++) {
		var ri = indexOps.sigToRow_(si) + 1;
		for (var ci = 1; ci < cols; ci++) {
		    selOps.setCellSelection_(ri, ci, 's');
		}
	    }

	} else if (colIndex == 0) {
	    /* Select whole row. */

	    for (var ci = 1; ci < cols; ci++) {
		selOps.setCellSelection_(rowIndex, ci, 's');
	    }

	} else if (rowIndex == 0) {
	    /* Select whole column. */

	    for (var si = 0; si < signals; si++) {
		var ri = indexOps.sigToRow_(si) + 1;
		selOps.setCellSelection_(ri, colIndex, 's');
	    }

	} else {
	    /* Toggle this cell's selection. */
	    selOps.setCellSelection_(rowIndex, colIndex, 't');
	}
    },


    /**
     * Handle single-click event on a cell while in ADDCOL/DELCOL state.
     */
    cell_click_COL: function(event)
    {
	var cell = event.currentTarget;
	var colIndex = tableOps.cellToColIndex_(cell);

	if (state == 'ADDCOL') {
	    tableOps.addCol_(colIndex + 1);

	} else if (state == 'DELCOL') {
	    if (colIndex > 0) {
		tableOps.delCol_(colIndex);
	    }

	}
    },


    /**
     * Handle single-click event on a cell.
     */
    cell_click: function(event)
    {
	if (state == 'MAIN') {
	    eventOps.cell_click_MAIN(event);

	} else if ((state == 'ADDCOL') || (state == 'DELCOL')) {
	    eventOps.cell_click_COL(event);

	} else {
	    uiOps.setMsg('ERROR: Unknown state: '.concat(state))
	}
    },


    /**
     * Handle double-click event on a cell.
     */
    cell_dblclick: function(event)
    {
	var cell = event.currentTarget;
	var rowIndex = tableOps.rowToRowIndex_(cell.parentNode);
	var colIndex = tableOps.cellToColIndex_(cell);

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
		input.onblur = eventOps.newName_onblur;

		cell.ondblclick = null;
	    }
	}
    },


    /**
     * Handle click event on a spacing cell (between signal rows).
     */
    spacingCell_click: function(event)
    {
	selOps.clearSelection();
    },


    /**
     * @private
     * Handle finish of editing signal name.
     * @param {string} newName New signal name.
     * @param {cell} cell Signal table cell.
     */
    newName_finish_: function(newName, cell)
    {
	cell.innerHTML = escape(newName.trim()).replace(/%20/g, ' ');
	cell.ondblclick = eventOps.cell_dblclick;
    },


    /**
     * Handle de-focus while editing signal name.
     */
    newName_onblur: function(event)
    {
	var input = event.currentTarget;
	eventOps.newName_finish_(input.value, input.parentNode);
    },


    /**
     * Handle request to add/delete column.
     * @param {string} op Operation ('add' or 'del').
     */
    reqAddDelCol: function(op)
    {
	op = op.trim().charAt(0).toLowerCase();

	var nextState = 'MAIN';

	if (op == 'a') {
	    nextState = 'ADDCOL';

	    uiOps.setMsg('Add a column after which column?');

	} else if (op == 'd') {
	    nextState = 'DELCOL';

	    uiOps.setMsg('Delete which column?');

	} else {
	    throw 'invalid operation';
	}

	selOps.clearSelection();

	if (state == nextState) {
	    /* Finished with operation. */
	    nextState = 'MAIN';
	    uiOps.setMsg('');
	}

	state = nextState;
    },
}
