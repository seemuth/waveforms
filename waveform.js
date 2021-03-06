/**
 * @fileoverview Functions for facilitating the creation of waveforms using
 * the accompanying waveform.html file.
 *
 * Copyright (c) 2013-2014 Daniel P. Seemuth
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
 * @version 0.13.0
 **/

var PROJ_NAME = 'Waveform Editor';
var VERSION = 'v0.13.0';

var START_SIGNALS = 4;
var START_COLS = 8;

var SETTINGS_DEFAULT = {
    includeColNums: false,
    clozeAnswers: '0,1',
    colGroupSize: 4,
};
var SETTINGS_TYPE = {
    includeColNums: 'bool',
    clozeAnswers: 'str',
    colGroupSize: 'int',
};
var SETTINGS_VALIDCHARS = ''.concat(
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
        '0123456789',
        '_, '
    );

var COLOR_SELECT = 'cyan';
var BORDER_SIGNAL = 'thick solid blue';
var BORDER_GRID = 'thin dotted black';
var BORDER_GROUP = 'medium dotted black';
var MINWIDTH_SIGNAME = '100px';
var MINWIDTH_DATACOL = '20px';
var FONTSIZE_SIGNAME = 'medium';

/* All Cloze parameters must be strings. */
var CLOZE_POINTS = '1';
var CLOZE_QUESTIONTYPE = 'MC';
var CLOZE_ANSWER_OPTIONS = [
    '0,1',
    '0,1,X',
];

var EXPORT_DATA_START = '<!--DATA--\n';
var EXPORT_DATA_STOP = '--DATA-->\n';
var EXPORT_SETTINGS_START = '<!--SETTINGS--\n';
var EXPORT_SETTINGS_STOP = '--SETTINGS-->\n';
var EXPORT_NAMEDATADELIM = ': ';
var EXPORT_VALDELIM = ',';
var EXPORT_LINEDELIM = ';\n';

var signals = 0;
var cols = 1;   /* Always have zeroth column (don't-care) */
var table;

var data = [];
var dataIsQuestion = [];
var signalNames = [];
var settings = {};

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
     *      (left) cell value.
     */
    addCell_: function(sigIndex, cellIndex, opt_value)
    {
        var mode;
        var value;
        var isQuestion = '0';

        if (sigIndex < 0) {
            throw new Error('sigIndex too low');
        } else if (sigIndex >= signals) {
            throw new Error('sigIndex too high');
        }

        if (cellIndex < 1) {
            throw new Error('cellIndex too low');
        } else if (cellIndex > cols) {
            throw new Error('cellIndex too high');
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
            isQuestion = dataIsQuestion[sigIndex][cellIndex - 1];

        } else {
            throw new Error('Invalid value');
        }

        data[sigIndex].splice(cellIndex, 0, value);
        dataIsQuestion[sigIndex].splice(cellIndex, 0, isQuestion);
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
            throw new Error('sigIndex too low');
        } else if (sigIndex >= signals) {
            throw new Error('sigIndex too high');
        }

        if (cellIndex < 1) {
            throw new Error('cellIndex too low');
        } else if (cellIndex > cols) {
            throw new Error('cellIndex too high');
        }

        data[sigIndex].splice(cellIndex, 1);
        dataIsQuestion[sigIndex].splice(cellIndex, 1);
    },


    /**
     * @private
     * Add data column at the specified position for all signals.
     * @param {number} colIndex Zero-based column index.
     * @param {string} [opt_value='x'] Use 0/1/x value or copy from previous
     *      (left) cell value.
     */
    addCol_: function(colIndex, opt_value)
    {
        if (colIndex < 1) {
            throw new Error('colIndex too low');
        } else if (colIndex > cols) {
            throw new Error('colIndex too high');
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
            throw new Error('colIndex too low');
        } else if (colIndex > cols) {
            throw new Error('colIndex too high');
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
        var isQuestionValues = [];

        if (sigIndex < 0) {
            throw new Error('sigIndex too low');
        } else if (sigIndex > signals) {
            throw new Error('sigIndex too high');
        }

        if (opt_value === undefined) {
            mode = 'x';
        } else {
            mode = opt_value.toString().trim().charAt(0).toLowerCase();
        }

        if ((mode == '0') || (mode == '1') || (mode == 'x')) {
            for (var i = 0; i < cols; i++) {
                values.push(mode);
                isQuestionValues.push('0');
            }

        } else {
            throw new Error('Invalid value');
        }

        data.splice(sigIndex, 0, values);
        dataIsQuestion.splice(sigIndex, 0, isQuestionValues);
        signalNames.splice(sigIndex, 0, 'SIG');

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
            throw new Error('sigIndex too low');
        } else if (sigIndex >= signals) {
            throw new Error('sigIndex too high');
        }

        data.splice(sigIndex, 1);
        dataIsQuestion.splice(sigIndex, 1);
        signalNames.splice(sigIndex, 1);

        signals--;
    },


    /**
     * @private
     * Set signal cell's value.
     * @param {number} sigIndex Zero-based signal index.
     * @param {number} colIndex Zero-based column index.
     * @param {string} mode Set/clear/toggle/dontcare value.
     */
    setCellValue_: function(sigIndex, colIndex, mode)
    {
        mode = mode.trim().charAt(0).toLowerCase();

        if (mode == 's') {
            data[sigIndex][colIndex] = '1';

        } else if (mode == 'c') {
            data[sigIndex][colIndex] = '0';

        } else if (mode == 't') {
            var current = data[sigIndex][colIndex];

            if (current == '0') {
                data[sigIndex][colIndex] = '1';
            } else if (current == '1') {
                data[sigIndex][colIndex] = '0';
            }

        } else if ((mode == 'd') || (mode == 'x')) {
            data[sigIndex][colIndex] = 'x';

        } else {
            throw new Error('invalid mode');
        }
    },


    /**
     * @private
     * Set signal cell to be given data or a question to be answered.
     * @param {number} sigIndex Zero-based signal index.
     * @param {number} colIndex Zero-based column index.
     * @param {string} isQuestion Question ('1'|'q') or data ('0'|'d')
     */
    setCellQuestion_: function(sigIndex, colIndex, isQuestion)
    {
        isQuestion = isQuestion.trim().charAt(0).toLowerCase();

        if ((isQuestion == '0') || (isQuestion == 'd')) {
            dataIsQuestion[sigIndex][colIndex] = '0';

        } else if ((isQuestion == '1') || (isQuestion == 'q')) {
            dataIsQuestion[sigIndex][colIndex] = '1';

        } else {
            throw new Error('invalid isQuestion');
        }
    },


    /**
     * @private
     * Convert data value to mode for calls to setCellValue_.
     * @param {string} dataVal 0|1|x
     * @return {string} mode set|clear|dontcare
     */
    valToMode_: function(dataVal)
    {
        var ret = null;

        if ((dataVal == '0') || (dataVal == 0)) {
            ret = 'clear';

        } else if ((dataVal == '1') || (dataVal == 1)) {
            ret = 'set';

        } else if (dataVal == 'x') {
            ret = 'x';

        } else {
            throw new Error('invalid data: ' + dataVal.toString());
        }

        return ret;
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
     *      (0 <= rowIndex <= # rows).
     */
    addRow_: function(rowIndex)
    {
        if (rowIndex < 0) {
            throw new Error('rowIndex too low');
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
        cell.innerHTML = tableOps.cellContents_(rowIndex, colIndex);

        tableOps.setCellEventCallbacks_(cell, rowIndex, colIndex);

        cell.style.borderRight = 'thin dotted black';

        if (rowIndex == 0) {
            /* Header row: center time indices. */

            if (colIndex > 0) {
                cell.style.textAlign = 'center';
            }

            /* Set minimum column widths. */
            if (colIndex == 0) {
                cell.style.minWidth = MINWIDTH_SIGNAME;
            } else {
                cell.style.minWidth = MINWIDTH_DATACOL;
            }

        } else if (((rowIndex - 1) % 2) == 1) {
            /* Signal row. */

            if (colIndex == 0) {
                /* Signal name. */
                cell.style.textAlign = 'right';
                cell.style.fontSize = FONTSIZE_SIGNAME;
            }
        }
    },


    /**
     * @private
     * Add table cell at the given row and column indices.
     * @param {number} rowIndex Add cell in this row
     *      (0 <= rowIndex < # rows).
     * @param {number} colIndex Add cell in this col
     *      (0 <= colIndex <= # cells).
     * @return {cell} Cell that was added to the table.
     */
    addCell_: function(rowIndex, colIndex)
    {
        if (rowIndex < 0) {
            throw new Error('rowIndex too low');
        }

        if (colIndex < 0) {
            throw new Error('colIndex too low');
        }

        var row = table.rows[rowIndex];
        var cell = row.insertCell(colIndex);

        tableOps.setUpCell_(cell, rowIndex, colIndex);

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
            throw new Error('index too high');
        }

        if (index < 0) {
            index = cols;
        }

        var colIndex = index;

        for (var r = 0; r < table.rows.length; r++) {
            tableOps.addCell_(r, colIndex);
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
            throw new Error('index too high');
        }

        if (index < 0) {
            index = cols;
        }

        var colIndex = index;

        for (var r = 0; r < table.rows.length; r++) {
            var row = table.rows[r];

            row.deleteCell(colIndex);
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
            throw new Error('invalid mode');
        }

        /* Update entering and leaving edges. */
        tableOps.updateCellEdge_(rowIndex, colIndex);
        tableOps.updateCellEdge_(rowIndex, colIndex + 1);
    },


    /**
     * @private
     * Set signal cell to be given data or a question to be answered.
     * @param {number} rowIndex Zero-based row index.
     * @param {number} colIndex Zero-based column index.
     * @param {string} isQuestion Question ('1'|'q') or data ('0'|'d')
     */
    setCellQuestion_: function(rowIndex, colIndex, isQuestion)
    {
        var cell = tableOps.coordsToCell_(rowIndex, colIndex);

        isQuestion = isQuestion.trim().charAt(0).toLowerCase();

        if ((isQuestion == '0') || (isQuestion == 'd')) {
            cell.innerHTML = '&nbsp;';

        } else if ((isQuestion == '1') || (isQuestion == 'q')) {
            cell.innerHTML = 'Q';

        } else {
            throw new Error('invalid isQuestion');
        }
    },


    /**
     * @private
     * Set cell's contents.
     * @param {number} rowIndex Zero-based row index.
     * @param {number} colIndex Zero-based column index.
     * @param {string} val Set contents to this value.
     */
    setCellContents_: function(rowIndex, colIndex, val)
    {
        var cell = tableOps.coordsToCell_(rowIndex, colIndex);
        cell.innerHTML = val;
    },


    /**
     * Update table header row with column indices.
     */
    updateHeader: function()
    {
        var row = table.rows[0];

        for (var c = 1; c < cols; c++) {
            row.cells[c].innerHTML = tableOps.cellContents_(0, c);
        }
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
            throw new Error('sigIndex too low');
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
            throw new Error('rowIndex too low');
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
            throw new Error('invalid mode');
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

            var sigIndex = indexOps.rowToSig_(rowIndex);

            dataOps.setCellValue_(sigIndex, colIndex, mode);
            tableOps.setCellValue_(rowIndex, colIndex, mode);
        }
    },


    /**
     * Set selected cells to be given data or questions to be answered.
     * @param {string} isQuestion Question ('1'|'q') or data ('0'|'d')
     */
    setSelectedCellQuestions: function(isQuestion)
    {
        for (var i = 0; i < selected.length; i++) {
            var parts = selected[i].split('x');
            var rowIndex = parseInt(parts[0]);
            var colIndex = parseInt(parts[1]);

            var sigIndex = indexOps.rowToSig_(rowIndex);

            dataOps.setCellQuestion_(sigIndex, colIndex, isQuestion);
            tableOps.setCellQuestion_(rowIndex, colIndex, isQuestion);
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


    /**
     * Set selected cells as given data.
     */
    setGivenData: function()
    {
        selOps.setSelectedCellQuestions('data');
    },


    /**
     * Set selected cells as questions to be answered.
     */
    setQuestions: function()
    {
        selOps.setSelectedCellQuestions('question');
    },


    /**
     * @private
     * Return rows containing selected cells.
     * @return {array} of {number}
     */
    rowsWithSelectedCells_: function()
    {
        var selectedRows = [];

        for (var i = 0; i < selected.length; i++) {
            var parts = selected[i].split('x');
            var rowIndex = parseInt(parts[0]);

            selectedRows[rowIndex] = true;
        }

        var ret = [];
        for (var i in selectedRows) {
            ret.push(parseInt(i));
        }

        return ret;
    },


    /**
     * @private
     * Return columns containing selected cells.
     * @return {array} of {number}
     */
    columnsWithSelectedCells_: function()
    {
        var selectedCols = [];

        for (var i = 0; i < selected.length; i++) {
            var parts = selected[i].split('x');
            var colIndex = parseInt(parts[1]);

            selectedCols[colIndex] = true;
        }

        var ret = [];
        for (var i in selectedCols) {
            ret.push(parseInt(i));
        }

        return ret;
    },


    /**
     * @private
     * Return selected cells by column.
     * @return {array} of {array} of {number} colIndex: [sigIndices]
     */
    selectedCellsByCol_: function()
    {
        var colToSig = [];

        /* Prepare colToSig to store selected cells by column. */
        for (var i = 0; i < cols; i++) {
            colToSig[i] = [];
        }

        for (var i = 0; i < selected.length; i++) {
            var parts = selected[i].split('x');
            var rowIndex = parseInt(parts[0]);
            var colIndex = parseInt(parts[1]);
            var sigIndex = indexOps.rowToSig_(rowIndex);

            colToSig[colIndex].push(sigIndex);
        }

        return colToSig;
    },


    /**
     * Shift selected cells left.
     */
    shiftLeft: function()
    {
        var colToSig = selOps.selectedCellsByCol_();

        /* Process columns left to right. */
        for (var colIndex = 2; colIndex < cols; colIndex++) {
            for (var i in colToSig[colIndex]) {
                var sigIndex = colToSig[colIndex][i];
                /* Add 1 to rowIndex to get to the signal row (not spacer). */
                var rowIndex = indexOps.sigToRow_(sigIndex) + 1;

                var dataVal = data[sigIndex][colIndex];
                var isQuestion = dataIsQuestion[sigIndex][colIndex];
                var mode = dataOps.valToMode_(dataVal);

                /* Shift left: copy data to (colIndex - 1). */
                dataOps.setCellValue_(sigIndex, colIndex - 1, mode);
                tableOps.setCellValue_(rowIndex, colIndex - 1, mode);
                dataOps.setCellQuestion_(sigIndex, colIndex - 1, isQuestion);
                tableOps.setCellQuestion_(rowIndex, colIndex - 1, isQuestion);

                /* Move selection to copied cell. */
                selOps.setCellSelection_(rowIndex, colIndex, 'toggle');
                if (colIndex > 2) {
                    selOps.setCellSelection_(rowIndex, colIndex - 1, 'toggle');
                }
            }
        }
    },


    /**
     * Shift selected cells right.
     */
    shiftRight: function()
    {
        var colToSig = selOps.selectedCellsByCol_();

        /* Process columns right to left. */
        for (var colIndex = cols - 2; colIndex > 0; colIndex--) {
            for (var i in colToSig[colIndex]) {
                var sigIndex = colToSig[colIndex][i];
                /* Add 1 to rowIndex to get to the signal row (not spacer). */
                var rowIndex = indexOps.sigToRow_(sigIndex) + 1;

                var dataVal = data[sigIndex][colIndex];
                var isQuestion = dataIsQuestion[sigIndex][colIndex];
                var mode = dataOps.valToMode_(dataVal);

                /* Shift right: copy data to (colIndex + 1). */
                dataOps.setCellValue_(sigIndex, colIndex + 1, mode);
                tableOps.setCellValue_(rowIndex, colIndex + 1, mode);
                dataOps.setCellQuestion_(sigIndex, colIndex + 1, isQuestion);
                tableOps.setCellQuestion_(rowIndex, colIndex + 1, isQuestion);

                /* Move selection to copied cell. */
                selOps.setCellSelection_(rowIndex, colIndex, 'toggle');
                if (colIndex < (cols - 2)) {
                    selOps.setCellSelection_(rowIndex, colIndex + 1, 'toggle');
                }
            }
        }
    },


    /**
     * Generate clock signals in selected rows.
     * @param {number} period Clock period
     * @param {bool} startHigh Clock should start with HIGH
     */
    genClocks: function(period, startHigh)
    {
        var rowIndices = selOps.rowsWithSelectedCells_();
        for (var i in rowIndices) {
            var rowIndex = rowIndices[i];
            var sigIndex = indexOps.rowToSig_(rowIndex);

            var curVal = startHigh;
            var pulse = period >> 1;

            var pulseLeft = pulse;
            for (var ci = 1; ci < cols; ci++) {
                var mode = (curVal) ? 's' : 'c';

                dataOps.setCellValue_(sigIndex, ci, mode);

                pulseLeft--;
                if (pulseLeft <= 0) {
                    curVal = ! curVal;
                    pulseLeft = pulse;
                }
            }

        }

        uiOps.updateDisplayedData();
    },
}


var uiOps = {
    /**
     * @private
     * Enable/show or disable/hide main editing buttons.
     * @param {bool} enable True to enable, false to disable.
     */
    enableMainEdit_: function(enable)
    {
        var mainEdit = document.getElementById('mainEdit');

        for (var i = 0; i < mainEdit.childNodes.length; i++) {
            var n = mainEdit.childNodes[i];

            if (n.nodeName.toLowerCase() == 'button') {
                n.disabled = ! enable;
            }
        }

        mainEdit.style.visibility = (enable) ? 'visible' : 'hidden';
    },


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
     * @private
     * Enable/show or disable/hide signal editing buttons.
     * @param {bool} enable True to enable, false to disable.
     */
    enableImportExport_: function(enable)
    {
        var importExport = document.getElementById('importExport');

        for (var i = 0; i < importExport.childNodes.length; i++) {
            var n = importExport.childNodes[i];

            if (n.nodeName.toLowerCase() == 'button') {
                n.disabled = ! enable;
            }
        }

        importExport.style.visibility = (enable) ? 'visible' : 'hidden';
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
     * Add elements to message box.
     * @param {array} elements Elements to add
     */
    addMsgElements: function(elements)
    {
        var msg = document.getElementById('msg');

        for (e in elements) {
            msg.appendChild(elements[e]);
        }
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

        tableOps.delSignal_(index);
        dataOps.delSignal_(index);
    },


    /**
     * Add column at the given index.
     * @param {number} index Add column at this index (<0 means last).
     * @param {string} [opt_value='x'] Use 0/1/x value or copy from previous
     *      (left) cell value.
     */
    addCol: function(index, opt_value)
    {
        selOps.clearSelection();

        if (index > cols) {
            throw new Error('index too high');
        }

        if (index < 0) {
            index = cols;
        }

        dataOps.addCol_(index, opt_value);
        tableOps.addCol_(index);

        tableOps.updateHeader();

        uiOps.updateDisplayedCells(0, -1, index - 1, index + 1);
    },


    /**
     * Delete the column at the given index.
     * @param {number} index Delete column at this index (<1 means last).
     */
    delCol: function(index)
    {
        selOps.clearSelection();

        if (cols <= 1) {
            /* No non-name columns to delete! */
            return;
        }

        if (index < 1) {
            index = cols - 1;
        }

        if (index >= cols) {
            throw new Error('index too high');
        }

        tableOps.delCol_(index);
        dataOps.delCol_(index);

        tableOps.updateHeader();

        uiOps.updateDisplayedCells(0, -1, index - 1, index + 1);
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
        if ((sigMax < 0) || (sigMax >= signals)) {
            sigMax = signals - 1;
        }
        if (colMin < 0) {
            colMin = 0;
        }
        if ((colMax < 0) || (colMax >= cols)) {
            colMax = cols - 1;
        }

        /* First update signal names if requested. */
        if (colMin < 1) {
            for (var sigIndex = sigMin; sigIndex <= sigMax; sigIndex++) {
                var rowIndex = indexOps.sigToRow_(sigIndex) + 1;
                tableOps.setCellContents_(rowIndex, 0, signalNames[sigIndex]);
            }

            colMin = 1;
        }

        for (var sigIndex = sigMin; sigIndex <= sigMax; sigIndex++) {
            for (var colIndex = colMin; colIndex <= colMax; colIndex++) {
                var dataVal = data[sigIndex][colIndex];
                var isQuestion = dataIsQuestion[sigIndex][colIndex];
                var mode = dataOps.valToMode_(dataVal);

                /* Add 1 to rowIndex to get to the signal row (not spacer). */
                var rowIndex = indexOps.sigToRow_(sigIndex) + 1;
                tableOps.setCellValue_(rowIndex, colIndex, mode);
                tableOps.setCellQuestion_(rowIndex, colIndex, isQuestion);
            }
        }
    },


    /**
     * Return to main state (editing waveform values).
     */
    stateMain: function()
    {
        state = 'MAIN';
        uiOps.setMsg('');
    },


    /**
     * Subdivide selected columns.
     */
    subdivideCols: function()
    {
        var selCols = selOps.columnsWithSelectedCells_();
        selOps.clearSelection();

        /* Sort descending so column indices don't change. */
        selCols.sort(function(a, b) { return b - a; });

        for (var i in selCols) {
            /* Split column by adding new column with same data. */
            uiOps.addCol(selCols[i] + 1, 'c');
        }
    },


    /**
     * Update GUI to reflect current settings.
     */
    settingsToUI: function()
    {
        var value;
        var index;

        document.getElementById('includeColNums').checked =
            settings['includeColNums'];


        var clozeAnswers = document.getElementById('clozeAnswers');
        value = settings['clozeAnswers'];
        index = -1;
        for (var i = 0; i < clozeAnswers.options.length; i++) {
            if (clozeAnswers.options[i].text == value) {
                index = i;
                break;
            }
        }
        if (index < 0) {
            throw new Error('invalid clozeAnswers: ', encodeURI(value));
        }
        clozeAnswers.selectedIndex = index;


        document.getElementById('colGroupSize').value =
            settings['colGroupSize'];
    },


    /**
     * Update settings from GUI.
     */
    UIToSettings: function()
    {
        var value;


        var includeColNums = document.getElementById('includeColNums');
        settings['includeColNums'] = includeColNums.checked;


        var clozeAnswers = document.getElementById('clozeAnswers');
        settings['clozeAnswers'] =
            clozeAnswers.options[clozeAnswers.selectedIndex].text;


        var colGroupSize = document.getElementById('colGroupSize');
        value = parseInt(colGroupSize.value.trim());
        if ((value > 0) && (value != NaN)) {
            colGroupSize.style.backgroundColor = '';
            settings['colGroupSize'] = value;
        } else {
            colGroupSize.style.backgroundColor = 'red';
        }
    },
}


var exportOps = {
    /**
     * @private
     * Return the style attribute for an HTML tag.
     * @param {array} of {string} styles CSS styles
     * @return {string} HTML tag attribute string
     */
    styleString_: function(styles)
    {
        var ret = '';

        var filteredStyles = [];
        for (var s in styles) {
            s = styles[s].trim();
            if (s.charAt(s.length - 1) != ';') {
                s = s.concat(';');
            }
            filteredStyles.push(s);
        }

        if (filteredStyles.length > 0) {
            ret = 'style="'.concat(filteredStyles.join(' '), '"');
        }

        return ret;
    },


    /**
     * @private
     * Return the text to represent a Cloze question.
     * @param {string} points Number of points question is worth, as string
     * @param {string} questionType Cloze question type (MC, MCH, etc.)
     * @param {array} of {string} answers Answer options
     * @param {string} correctAnswer Correct answer (must be in answers)
     * @return {string} Cloze-formatted question
     */
    clozeQuestion_: function(points, questionType, answers, correctAnswer)
    {
        var formattedAnswers = [];
        var foundCorrectAnswer = false;

        for (var i in answers) {
            var a = answers[i];

            if (a == correctAnswer) {
                foundCorrectAnswer = true;
                a = '='.concat(a);
            }

            formattedAnswers.push(a);
        }

        if (! foundCorrectAnswer) {
            throw new Error('correctAnswer not in answers: ' + correctAnswer);
        }

        return '{'.concat(
            points,
            ':',
            questionType,
            ':',
            formattedAnswers.join('~'),
            '}'
        );
    },


    /**
     * @private
     * Return the CSS style for the vertical column border.
     * @param {number} colIndex Zero-based column index
     */
    colBorder_: function(colIndex)
    {
        var ret = 'border-right: '.concat(BORDER_GRID);

        /* No grouping for first or last columns. */
        if ((colIndex > 0) && (colIndex < (cols - 1))) {
            if ((colIndex % settings['colGroupSize']) == 0) {
                ret = 'border-right: '.concat(BORDER_GROUP);
            }
        }

        return ret;
    },


    /**
     * @private
     * Return the HTML to represent the header row.
     * @return {string} HTML of header row
     */
    header_: function()
    {
        var ret = '';

        var styles_default = [
            'text-align: center;',
        ];

        ret = ret.concat('<tr>\n');

        for (var c = 0; c < cols; c++) {
            var styles = styles_default.slice(0);

            styles.push(exportOps.colBorder_(c));

            ret = ret.concat('<td ',
                    exportOps.styleString_(styles),
                    '>'
                );

            if (c == 0) {
                ret = ret.concat('&nbsp;');
            } else {
                ret = ret.concat(c.toString());
            }

            ret = ret.concat('</td>\n');
        }

        ret = ret.concat('</tr>\n');

        return ret;
    },


    /**
     * @private
     * Return the HTML to represent one signal's data.
     * @param {number} sigIndex Zero-based signal index
     * @param {bool} [opt_includeSpacer=true] Include spacer row
     * @return {string} HTML of signal data
     */
    signal_: function(sigIndex, opt_includeSpacer)
    {
        ret = '';

        if (sigIndex < 0) {
            throw new Error('sigIndex too low');
        } else if (sigIndex >= signals) {
            throw new Error('sigIndex too high');
        }

        var styles_default = [
        ];


        if (opt_includeSpacer === undefined) {
            opt_includeSpacer = true;
        }

        if (opt_includeSpacer) {
            /* Spacer row. */
            ret = ret.concat('<tr>\n');
            for (var c = 0; c < cols; c++) {
                var styles = styles_default.slice(0);

                styles.push(exportOps.colBorder_(c));

                ret = ret.concat('<td ',
                        exportOps.styleString_(styles),
                        '>&nbsp;</td>\n'
                        );
            }
            ret = ret.concat('</tr>\n');
        }

        /* Data row. */
        ret = ret.concat('<tr>\n');
        for (var c = 0; c < cols; c++) {
            var styles = styles_default.slice(0);

            styles.push(exportOps.colBorder_(c));

            var minWidth = null;

            if (sigIndex == 0) {
                if (c == 0) {
                    minWidth = MINWIDTH_SIGNAME;
                } else {
                    minWidth = MINWIDTH_DATACOL;
                }
            }

            if (minWidth != null) {
                styles.push('min-width: '.concat(minWidth, ';'));
            }

            if (c == 0) {
                /* Signal name column. */
                styles.push('text-align: right;');
                styles.push('font-size: '.concat(FONTSIZE_SIGNAME, ';'));
                ret = ret.concat('<td ',
                        exportOps.styleString_(styles),
                        '>'
                    );
                ret = ret.concat(signalNames[sigIndex]);
                ret = ret.concat('</td>\n');

            } else {
                /* Data column. */
                var prev = data[sigIndex][c-1];
                var cur = data[sigIndex][c];
                var isQuestion = dataIsQuestion[sigIndex][c];

                var content;

                if (isQuestion == '1') {
                    var answers = settings['clozeAnswers'];
                    answers = answers.toUpperCase().split(',');

                    content = exportOps.clozeQuestion_(
                            CLOZE_POINTS,
                            CLOZE_QUESTIONTYPE,
                            answers,
                            cur.toString().toUpperCase()
                        );

                } else {
                    content = '&nbsp;';

                    if (cur == '0') {
                        styles.push(
                                'border-bottom: '.concat(BORDER_SIGNAL, ';')
                            );
                    } else if (cur == '1') {
                        styles.push(
                                'border-top: '.concat(BORDER_SIGNAL, ';')
                            );
                    }

                    /* Render rising or falling edge. */
                    var pc = prev.concat(cur);
                    if ((pc == '01') || (pc == '10')) {
                        styles.push(
                                'border-left: '.concat(BORDER_SIGNAL, ';')
                            );
                    }
                }

                ret = ret.concat('<td ',
                        exportOps.styleString_(styles),
                        '>',
                        content,
                        '</td>\n'
                    );
            }
        }
        ret = ret.concat('</tr>\n');

        return ret;
    },


    /**
     * @private
     * Return internal data in comment format for import/export.
     * @return {string} HTML comment containing internal data
     */
    data_: function()
    {
        var ret = EXPORT_DATA_START;

        for (var sigIndex = 0; sigIndex < signals; sigIndex++) {
            /* Skip first column (always don't-care). */

            var sigDataCols = [];

            for (var i in data[sigIndex]) {
                if (i < 1) {
                    /* Skip hidden first column. */
                    continue;
                }

                var value = data[sigIndex][i];
                var isQuestion = dataIsQuestion[sigIndex][i];
                var exportVal = 'd';

                if (isQuestion == '1') {
                    exportVal = 'q';
                }

                exportVal = exportVal.concat(value);

                sigDataCols.push(exportVal);
            }

            ret = ret.concat(
                    signalNames[sigIndex],
                    EXPORT_NAMEDATADELIM,
                    sigDataCols.join(EXPORT_VALDELIM),
                    EXPORT_LINEDELIM
                );
        }

        ret = ret.concat(EXPORT_DATA_STOP);

        return ret;
    },


    /**
     * @private
     * Return settings in comment format for import/export.
     * @return {string} HTML comment containing settings
     */
    settings_: function()
    {
        var ret = EXPORT_SETTINGS_START;

        for (var i in SETTINGS_DEFAULT) {
            var key = encodeURIComponent(i);
            var value = encodeURIComponent(settings[i]);

            ret = ret.concat(
                    key,
                    EXPORT_NAMEDATADELIM,
                    value,
                    EXPORT_LINEDELIM
                );
        }

        ret = ret.concat(EXPORT_SETTINGS_STOP);

        return ret;
    },


    /**
     * Clear the waveform I/O textarea.
     */
    clearWaveform: function()
    {
        document.getElementById('io_waveform').value = '';
    },


    /**
     * Copy the table's HTML into the I/O textarea so the user can copy/paste.
     */
    showWaveform: function()
    {
        selOps.clearSelection();

        var io = document.getElementById('io_waveform');
        var text = '<div style="overflow: auto">\n'.concat(
                '<table cellspacing="0"',
                ' style="border: none; border-collapse: collapse;">\n'
            );

        if (settings['includeColNums']) {
            text = text.concat(exportOps.header_());
        }

        for (sigIndex = 0; sigIndex < signals; sigIndex++) {
            var includeSpacer = (settings['includeColNums']) || (sigIndex > 0);
            text = text.concat(exportOps.signal_(sigIndex, includeSpacer));
        }

        text = text.concat(
                '</table>\n',
                '</div>\n'
            );

        io.value = text;
    },



    /**
     * @private
     * Validate settings and data before exporting.
     * Update UI with message if invalid.
     * Highlight errant cell if invalid.
     * @return {bool} valid True if everything is valid, or False otherwise.
     */
    validate_: function()
    {
        /* Make sure all question data is within clozeAnswers. */
        var clozeAnswers = settings['clozeAnswers'].toUpperCase().split(',');

        for (var sigIndex = 0; sigIndex < signals; sigIndex++) {
            for (var colIndex = 1; colIndex < cols; colIndex++) {
                var value = data[sigIndex][colIndex].toUpperCase();
                var isQuestion = dataIsQuestion[sigIndex][colIndex];

                if (isQuestion == '1') {
                    if (helper.indexOf(clozeAnswers, value) < 0) {
                        uiOps.setMsg('Value ' + value +
                                ' not in Cloze choices'
                            );
                        var rowIndex = indexOps.sigToRow_(sigIndex) + 1;
                        selOps.setCellSelection_(rowIndex, colIndex, 's');
                        return false;
                    }
                }
            }
        }

        return true;
    },


    /**
     * Write data/settings to the data textarea so the user can copy/paste.
     */
    showDataSettings: function()
    {
        var io = document.getElementById('io_data');
        var text = '';

        text = text.concat(exportOps.data_());
        text = text.concat(exportOps.settings_());

        io.value = text;

        uiOps.setMsg('Export successful!');
    },
}


var importOps = {
    /**
     * @private
     * Search for the given string and cut it out.
     * @param {string} haystack Search within this string
     * @param {string} needle Search for this string
     * @return {null|string} Remaining string after needle; null if not found
     */
    cutString_: function(haystack, needle)
    {
        var match = haystack.indexOf(needle);
        if (match < 0) {
            return null;
        }
        return haystack.substr(match + needle.length);
    },


    /**
     * @private
     * Convert string representation to signal names and data.
     *
     * String format: START SIGNAL* STOP
     *      SIGNAL := SIGNAME NAMEDATADELIM DATA SIGDELIM
     *      SIGNAME := \w+
     *      DATA := DATAVAL (VALDELIM DATAVAL)*
     *      DATAVAL := QUESTION_OR_DATA VALUE
     *      QUESTION_OR_DATA := [qd]
     *      VALUE := [01x]
     *      START := <defined as EXPORT_DATA_START>
     *      NAMEDATADELIM := <defined as EXPORT_NAMEDATADELIM>
     *      SIGDELIM := <defined as EXPORT_LINEDELIM>
     *      VALDELIM := <defined as EXPORT_VALDELIM>
     *      STOP := <defined as EXPORT_DATA_STOP>
     *
     * @param {string} importData Use signal data in this string.
     * @return {array} containing [newNames, newData]
     */
    HTML2data_: function(importData)
    {
        var START = EXPORT_DATA_START.trim();
        var NAMEDATADELIM = EXPORT_NAMEDATADELIM.trim();
        var SIGDELIM = EXPORT_LINEDELIM.trim();
        var VALDELIM = EXPORT_VALDELIM.trim();
        var STOP = EXPORT_DATA_STOP.trim();

        var newNames = [];
        var newData = [];
        var newDataIsQuestion = [];

        var remain = importData.trim();

        /* Keep only content between START and STOP. */
        remain = importOps.cutString_(remain, START);
        if (remain === null) {
            throw new Error('START not found');
        }

        var match = remain.indexOf(STOP);
        if (match < 0) {
            throw new Error('STOP not found');
        }
        remain = remain.substr(0, match);

        remain = remain.trim();

        /* Now parse actual data. */
        while (remain.length > 0) {
            match = remain.indexOf(NAMEDATADELIM);
            if (match < 0) {
                throw new Error('NAMEDATADELIM not found');
            }
            newNames.push(remain.substr(0, match).trim());
            remain = importOps.cutString_(remain, NAMEDATADELIM).trim();

            match = remain.indexOf(SIGDELIM);
            if (match < 0) {
                throw new Error('SIGDELIM not found');
            }
            var dataValueStr = remain.substr(0, match).trim();
            remain = importOps.cutString_(remain, SIGDELIM).trim();

            var dataValueWords = dataValueStr.split(VALDELIM);
            var values = [];
            var isQuestion = [];
            for (var i in dataValueWords) {
                var valueWord = dataValueWords[i].trim();
                var qd = valueWord[0];
                var v = valueWord[1];
                if ('qd'.indexOf(qd) < 0) {
                    throw new Error('invalid q/d: ' + encodeURI(qd));
                }
                if ('01x'.indexOf(v) < 0) {
                    throw new Error('invalid value: ' + encodeURI(v));
                }
                values.push(v);
                isQuestion.push(qd);
            }

            newData.push(values);
            newDataIsQuestion.push(isQuestion);
        }

        /* Make sure all dimensions match. */
        if (newNames.length != newData.length) {
            throw new Error('name/data lengths do not match!');
        }

        /* Check size of each signal (if any exist). */
        for (var i in newData) {
            if (newData[i].length != newData[0].length) {
                throw new Error('signal data sizes do not match!');
            }
        }

        return [newNames, newData, newDataIsQuestion];
    },


    /**
     * @private
     * Convert string representation to settings: keys and values.
     *
     * String format: START SETTING* STOP
     *      SETTING := URIENCODED NAMEDATADELIM URIENCODED SIGDELIM
     *      URIENCODED := [a-zA-Z0-9_%-]+
     *      START := <defined as EXPORT_SETTINGS_START>
     *      NAMEDATADELIM := <defined as EXPORT_NAMEDATADELIM>
     *      LINEDELIM := <defined as EXPORT_LINEDELIM>
     *      STOP := <defined as EXPORT_SETTINGS_STOP>
     *
     * @param {string} importData Use settings in this string.
     * @return {array} new settings
     */
    HTML2settings_: function(importData)
    {
        var START = EXPORT_SETTINGS_START.trim();
        var NAMEDATADELIM = EXPORT_NAMEDATADELIM.trim();
        var LINEDELIM = EXPORT_LINEDELIM.trim();
        var STOP = EXPORT_SETTINGS_STOP.trim();

        var newSettings = {};

        var remain = importData.trim();

        /* Keep only content between START and STOP. */
        remain = importOps.cutString_(remain, START);
        if (remain === null) {
            /* Settings block is optional. */
            return newSettings;
        }

        var match = remain.indexOf(STOP);
        if (match < 0) {
            throw new Error('STOP not found');
        }
        remain = remain.substr(0, match);

        remain = remain.trim();

        /* Now parse actual data. */
        while (remain.length > 0) {
            match = remain.indexOf(NAMEDATADELIM);
            if (match < 0) {
                throw new Error('NAMEDATADELIM not found');
            }
            var key = decodeURIComponent(remain.substr(0, match).trim());
            remain = importOps.cutString_(remain, NAMEDATADELIM).trim();

            match = remain.indexOf(LINEDELIM);
            if (match < 0) {
                throw new Error('LINEDELIM not found');
            }
            var value = decodeURIComponent(remain.substr(0, match).trim());
            remain = importOps.cutString_(remain, LINEDELIM).trim();

            for (var i in key) {
                var c = key[i];
                if (SETTINGS_VALIDCHARS.indexOf(c) < 0) {
                    throw new Error('invalid char: ' + encodeURI(c));
                }
            }

            for (var i in value) {
                var c = value[i];
                if (SETTINGS_VALIDCHARS.indexOf(c) < 0) {
                    throw new Error('invalid char: ' + encodeURI(c));
                }
            }

            var settingType = SETTINGS_TYPE[key];

            if (settingType == 'bool') {
                value = value.trim().toLowerCase();
                if (value == 'false') {
                    value = false;
                } else if (value == 'true') {
                    value = true;
                } else {
                    throw new Error('invalid ' + settingType + ': ' +
                            encodeURI(value));
                }

            } else if (settingType == 'int') {
                var parsed = parseInt(value);
                if (parsed === NaN) {
                    throw new Error('invalid ' + settingType + ': ' +
                            encodeURI(value));
                }

                value = parsed;
            }

            newSettings[key] = value;
        }

        return newSettings;
    },


    /**
     * Overwrite waveform with data from string representation.
     * @param {string} importData Use signal data in this string.
     */
    importHTML: function(importData)
    {
        var success = true;

        try {
            /* Import signal data. */
            var d = importOps.HTML2data_(importData);

            var newNames = d[0];
            var newData = d[1];
            var newDataIsQuestion = d[2];

            /* Delete old data. */
            while (signals > 0) {
                uiOps.delSignal(-1);
            }
            while (cols > 1) {
                uiOps.delCol(-1);
            }

            /* Add columns for new data. */
            var addCols = 0;
            if (newData.length > 0) {
                addCols = newData[0].length;
            }
            for (; addCols > 0; addCols--) {
                uiOps.addCol(-1);
            }

            /* Add signals and overwrite with new data. */
            for (var i in newNames) {
                uiOps.addSignal(i);
                signalNames[i] = newNames[i];

                var newRow = newData[i];

                for (var c in newRow) {
                    c = new Number(c);

                    /* First column is not exported or imported. */
                    data[i][c + 1] = newRow[c];
                }


                var newRow = newDataIsQuestion[i];

                for (var c in newRow) {
                    c = new Number(c);

                    var isQuestion = newRow[c];
                    if (isQuestion == 'd') {
                        isQuestion = '0';

                    } else if (isQuestion == 'q') {
                        isQuestion = '1';
                    }

                    /* First column is not exported or imported. */
                    dataIsQuestion[i][c + 1] = isQuestion;
                }
            }

            uiOps.updateDisplayedData();


            /* Import settings. */
            var s = importOps.HTML2settings_(importData);

            for (var k in s) {
                if (! (k in SETTINGS_DEFAULT)) {
                    throw new Error('Unknown setting: ' + k);
                }
            }

            for (var k in SETTINGS_DEFAULT) {
                settings[k] = SETTINGS_DEFAULT[k];
            }

            for (var k in s) {
                settings[k] = s[k];
            }


            uiOps.settingsToUI();
            uiOps.setMsg('Import successful!');


        } catch (err) {
            uiOps.setMsg(
                    'Error [' +
                    err.lineNumber +
                    '] importing: ' +
                    err.message
                );
        }
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


        /* Set settings to defaults. */
        for (var k in SETTINGS_DEFAULT) {
            settings[k] = SETTINGS_DEFAULT[k];
        }


        /* Add export settings options. */
        var clozeAnswers = document.getElementById('clozeAnswers');
        for (var i in CLOZE_ANSWER_OPTIONS) {
            var v = CLOZE_ANSWER_OPTIONS[i];

            clozeAnswers.options.add(new Option(v, v));
        }


        /* Update GUI to reflect settings. */
        uiOps.settingsToUI();


        uiOps.enableMainEdit_(true);
        uiOps.enableSigEdit_(false);
        uiOps.enableImportExport_(true);
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
            uiOps.addCol(colIndex + 1, 'c');    /* Copy from previous col. */

        } else if (state == 'DELCOL') {
            if (colIndex > 0) {
                uiOps.delCol(colIndex);
            }

        }
    },


    /**
     * Handle single-click event on a cell while in ADDSIG/DELSIG state.
     */
    cell_click_SIG: function(event)
    {
        var cell = event.currentTarget;
        var rowIndex = tableOps.rowToRowIndex_(cell.parentNode);

        var sigIndex = -1;
        if (rowIndex > 0) {
            sigIndex = indexOps.rowToSig_(rowIndex);
        }

        if (state == 'ADDSIG') {
            uiOps.addSignal(sigIndex + 1, 'x');

        } else if (state == 'DELSIG') {
            if (sigIndex >= 0) {
                uiOps.delSignal(sigIndex);
            }

        }
    },


    /**
     * Handle single-click event on a cell while in RENAME state.
     */
    cell_click_RENAME: function(event)
    {
        /* Do nothing! */
    },


    /**
     * Handle single-click event on a cell while in GENCLOCK state.
     */
    cell_click_GENCLOCK: function(event)
    {
        /* Do nothing! */
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

        } else if ((state == 'ADDSIG') || (state == 'DELSIG')) {
            eventOps.cell_click_SIG(event);

        } else if (state == 'RENAME') {
            eventOps.cell_click_RENAME(event);

        } else if (state == 'GENCLOCK') {
            eventOps.cell_click_GENCLOCK(event);

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
                state = 'RENAME';

                var oldName = cell.innerHTML;

                cell.innerHTML = '<input type="text" id="newName"'.concat(
                        ' value="',
                        oldName,
                        '" />'
                        );

                var input = document.getElementById('newName');
                input.onblur = eventOps.newName_onblur;
                input.select();

                cell.ondblclick = null;

                uiOps.enableMainEdit_(false);
                uiOps.enableImportExport_(false);
                selOps.clearSelection();

                uiOps.setMsg('Press TAB to finish editing the signal name.');
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
        cell.innerHTML = encodeURIComponent(
                newName.trim()
            ).replace(
                /%20/g, ' '
            );
        cell.ondblclick = eventOps.cell_dblclick;
        uiOps.stateMain();
        uiOps.enableMainEdit_(true);
        uiOps.enableImportExport_(true);

        var rowIndex = tableOps.rowToRowIndex_(cell.parentNode);
        var sigIndex = indexOps.rowToSig_(rowIndex);

        signalNames[sigIndex] = cell.innerHTML;
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
     * Done adding/deleting column(s).
     */
    reqAddDelColDone: function()
    {
        uiOps.stateMain();
        uiOps.enableImportExport_(true);
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
            throw new Error('invalid operation');
        }

        var button = document.createElement('BUTTON');
        button.appendChild(helper.text_('Done'));
        button.onclick = eventOps.reqAddDelColDone;

        uiOps.addMsgElements([helper.text_(' '), button]);

        selOps.clearSelection();

        if (state == nextState) {
            /* Finished with operation. */
            eventOps.reqAddDelColDone();

        } else {
            state = nextState;
            uiOps.enableImportExport_(false);
        }
    },


    /**
     * Done adding/deleting signal(s).
     */
    reqAddDelSigDone: function()
    {
        uiOps.stateMain();
        uiOps.enableImportExport_(true);
    },


    /**
     * Handle request to add/delete signal.
     * @param {string} op Operation ('add' or 'del').
     */
    reqAddDelSig: function(op)
    {
        op = op.trim().charAt(0).toLowerCase();

        var nextState = 'MAIN';

        if (op == 'a') {
            nextState = 'ADDSIG';

            uiOps.setMsg('Add a signal after which signal?');

        } else if (op == 'd') {
            nextState = 'DELSIG';

            uiOps.setMsg('Delete which signal?');

        } else {
            throw new Error('invalid operation');
        }

        var button = document.createElement('BUTTON');
        button.appendChild(helper.text_('Done'));
        button.onclick = eventOps.reqAddDelSigDone;

        uiOps.addMsgElements([helper.text_(' '), button]);

        selOps.clearSelection();

        if (state == nextState) {
            /* Finished with operation. */
            eventOps.reqAddDelSigDone();

        } else {
            state = nextState;
            uiOps.enableImportExport_(false);
        }
    },


    /**
     * Confirm parameters for generated clock.
     */
    reqGenClockConfirm: function()
    {
        var inputClockPeriod = document.getElementById('clockGen_period');
        var clockPeriod = parseInt(inputClockPeriod.value);
        var startHigh = document.getElementById('clockGen_startHigh').checked;

        /* Validate clock period. */
        if (((clockPeriod % 2) != 0) || (clockPeriod < 2)) {
            inputClockPeriod.style.backgroundColor = 'red';
            inputClockPeriod.select();
            return;
        }

        selOps.genClocks(clockPeriod, startHigh);

        eventOps.reqGenClockCleanup_();
    },


    /**
     * Cancel generating clock.
     */
    reqGenClockCancel: function()
    {
        eventOps.reqGenClockCleanup_();
    },


    /**
     * @private
     * Cleanup after clock gen (or cancel).
     */
    reqGenClockCleanup_: function()
    {
        uiOps.stateMain();
        uiOps.enableImportExport_(true);
        uiOps.enableMainEdit_(true);
        uiOps.enableSigEdit_(true);
    },


    /**
     * Handle request to generate clock.
     */
    reqGenClock: function()
    {
        var rowIndices = selOps.rowsWithSelectedCells_();

        /* Expand selection to full rows. */
        for (var i = 0; i < rowIndices.length; i++) {
            var rowIndex = rowIndices[i];

            for (var ci = 1; ci < cols; ci++) {
                selOps.setCellSelection_(rowIndex, ci, 's');
            }
        }

        uiOps.setMsg('Specify parameters for generating clock...');

        var clockSettings = document.createElement('UL');

        var clockPeriod = document.createElement('LI');
        var labelClockPeriod = document.createElement('LABEL');
        var inputClockPeriod = document.createElement('INPUT');
        inputClockPeriod.id = 'clockGen_period';
        inputClockPeriod.type = 'text';
        inputClockPeriod.value = '2';
        inputClockPeriod.size = 4;
        labelClockPeriod.appendChild(helper.text_('Clock period: '));
        labelClockPeriod.appendChild(inputClockPeriod);
        clockPeriod.appendChild(labelClockPeriod);

        clockSettings.appendChild(clockPeriod);

        var startHigh = document.createElement('LI');
        var labelStartHigh = document.createElement('LABEL');
        var inputStartHigh = document.createElement('INPUT');
        inputStartHigh.id = 'clockGen_startHigh';
        inputStartHigh.type = 'checkbox';
        labelStartHigh.appendChild(helper.text_('Clock starts HIGH '));
        labelStartHigh.appendChild(inputStartHigh);
        startHigh.appendChild(labelStartHigh);

        clockSettings.appendChild(startHigh);

        uiOps.addMsgElements([clockSettings]);

        var confirmButton = document.createElement('BUTTON');
        confirmButton.appendChild(helper.text_('Generate'));
        confirmButton.onclick = eventOps.reqGenClockConfirm;

        var cancelButton = document.createElement('BUTTON');
        cancelButton.appendChild(helper.text_('Cancel'));
        cancelButton.onclick = eventOps.reqGenClockCancel;

        uiOps.addMsgElements([confirmButton, cancelButton]);


        /* Focus and select all text in clock period input. */
        inputClockPeriod.select();

        state = 'GENCLOCK';
        uiOps.enableImportExport_(false);
        uiOps.enableMainEdit_(false);
        uiOps.enableSigEdit_(false);
    },


    /**
     * Handle request to export waveform to I/O textboxes.
     */
    exportWaveform: function()
    {
        uiOps.UIToSettings();

        exportOps.clearWaveform();

        if (! exportOps.validate_()) {
            return;
        }

        exportOps.showWaveform();
        exportOps.showDataSettings();
    },


    /**
     * Handle request to import data from data textbox.
     */
    importWaveform: function()
    {
        var io = document.getElementById('io_data');
        importOps.importHTML(io.value);
    },
}
