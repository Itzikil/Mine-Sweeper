'use strict'

const MINE = '💣'
const FLAG = '🚩'

// var gHint = false
var gBoard
var gUndo = false
var gtimeInterval
var gGame
var firstTurn = true
var gNumOfSafeTry = 3
var gExterminatorTry = true
var gLastMove = []
var gRecord = [Infinity]
var gLevel = {
    SIZE: 4,
    MINES: 3,
}

function restart() {
    gGame = {
        isOn: true,
        shownCount: 0,
        markedCount: 0,
        secsPassed: 0,
    }
    // gUndo = 0
    gLevel.life = 3
    gExterminatorTry = true
    gLastMove = []
    firstTurn = true

    var life = document.querySelector('.life')
    life.innerHTML = `Life ${gLevel.life}`

    gNumOfSafeTry = 3
    var elBtn = document.querySelector('.safeclick')
    elBtn.innerHTML = `Safe clicks ${gNumOfSafeTry}`

    var bestScore = document.querySelector('.bestscore')
    localStorage.setItem('highest score', bestScore.innerHTML)

    var local = localStorage.getItem('highest score')
    bestScore.innerHTML = local

    var mineDec = document.querySelector('.mine-exterminator')
    mineDec.style.textDecoration = 'none'
}

function init() {
    clearInterval(gtimeInterval)
    gBoard = createBoard()
    restart()
    gGame.secsPassed = 0
    gtimeInterval = setInterval(timer, 1000)
    renderBoard(gBoard)
}

function createBoard() {
    var mat = []
    for (var i = 0; i < gLevel.SIZE; i++) {
        mat.push([])
        for (var j = 0; j < gLevel.SIZE; j++) {
            mat[i][j] = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false,
                lastMove: false,
                j,
                i,
            }
        }
    }
    return mat
}

function safeClick(elBtn) {
    if (gGame.shownCount !== 0) {

        var safeClicks = []
        for (var i = 0; i < gLevel.SIZE; i++) {
            for (var j = 0; j < gLevel.SIZE; j++) {
                if (!gBoard[i][j].isMine && !gBoard[i][j].isShown) {
                    var cell = { i: gBoard[i][j].i, j: gBoard[i][j].j }
                    safeClicks.push(cell)
                }
            }
        }
        if (gNumOfSafeTry) {
            var randomNum = getRandomIntInclusive(0, safeClicks.length - 1)
            var safeCell = safeClicks.splice(randomNum, 1)[0]
            var cell = document.querySelector('.cell-' + safeCell.i + '-' + safeCell.j)
            var blink = setInterval(() => { cell.classList.toggle('safeblink') }, 400)
            setTimeout(() => { clearInterval(blink) }, 2500)
            gNumOfSafeTry--
            elBtn.innerHTML = `Safe clicks ${gNumOfSafeTry}`
        }
    }
}

function allCells(board) {
    for (var i = 0; i <= board.length - 1; i++) {
        for (var j = 0; j <= board[0].length - 1; j++) {
            var cell = board[i][j]
            minesNegsCount(cell, gBoard)
            if (cell.minesAroundCount === 0) cell.minesAroundCount = ''
        }
    }
}

function minesNegsCount(cell, board) {
    if (cell.isMine === true) return
    for (var i = cell.i - 1; i <= cell.i + 1; i++) {
        if (i < 0 || i > board.length - 1) continue
        for (var j = cell.j - 1; j <= cell.j + 1; j++) {
            if (i === cell.I && j === cell.J) continue;
            if (j < 0 || j > board[0].length - 1) continue
            if (board[i][j].isMine === true) {
                cell.minesAroundCount++
            }
        }
    }
}

function renderBoard(table) {
    var strHTML = ``
    for (var i = 0; i < table.length; i++) {
        strHTML += `<tr>`
        for (var j = 0; j < table[0].length; j++) {
            var cell = table[i][j]
            if (cell.isMine === true) strHTML += `<td class='cell mark' onclick="cellClicked(this ,${i}, ${j})"></td>`
            else strHTML += `<td class='cell mark cell-${i}-${j}' onmousedown="cellClicked(this ,${i}, ${j}, event)"></td>`
        }
        strHTML += `</tr>`
    }
    var mat = document.querySelector('.mat')
    mat.innerHTML = strHTML

}

function cellClicked(elCell, i, j, ev) {
    if (gGame.isOn) {
        if (ev.which === 3 && !gBoard[i][j].isShown) cellMarked(elCell, i, j, ev)
        // else if (gHint === true){ 
        //     hint(elCell, i, j)
        //     return
        // }
        else {
            var smiley = document.querySelector('.restart')
            if (gBoard[i][j].isMine && !gBoard[i][j].isShown) {
                elCell.classList.remove('mark')
                elCell.innerText = MINE
                gLevel.life--
                var life = document.querySelector('.life')
                life.innerHTML = `Life ${gLevel.life}`
                smiley.innerText = '😵'
                gBoard[i][j].isShown = true
            } else if (!gBoard[i][j].isShown) {
                if (firstTurn) {
                    firstTurn = false
                    mineMaker(gLevel.MINES)
                    allCells(gBoard)
                }
                if (gBoard[i][j].minesAroundCount === '') fullExpand(gBoard[i][j], gBoard)
                if (!gBoard[i][j].isShown) {
                    gBoard[i][j].isShown = true
                    gGame.shownCount++
                }
                smiley.innerText = '😄'
                elCell.innerText = gBoard[i][j].minesAroundCount
                elCell.classList.remove('mark')
            }
        }
        checkGameOver()
        undo(false, elCell)
    }
}

function undo(gUndo, elCell) {
    if (gGame.isOn) {
        if (gUndo === false) {
            gLastMove.unshift([])
            for (var i = 0; i < gBoard.length; i++) {
                for (var j = 0; j < gBoard[0].length; j++) {
                    if (gBoard[i][j].isShown === true && gBoard[i][j].lastMove === false) {
                        gBoard[i][j].lastMove = true
                        gLastMove[0].unshift(gBoard[i][j])
                    }
                }
            }
        } else {
            for (var m = 0; m < gLastMove[0].length; m++) {
                var i = gLastMove[0][m].i
                var j = gLastMove[0][m].j
                gLastMove[0][m].isShown = false
                gBoard[i][j].lastMove = false
                var elCell = document.querySelector('.cell-' + i + '-' + j)
                elCell.classList.add('mark')
                elCell.innerText = ''
                if (!gLastMove[0][m].isMine) gGame.shownCount--
                if (gLastMove[0][m].isMine) gLevel.life++
                var life = document.querySelector('.life')
                life.innerHTML = `Life ${gLevel.life}`
            }
            gUndo = false
            gLastMove.splice(0, 1)
        }
    }
}

// in progress
// function hint(elCell, i, j) {
//     if (gHint) {
//         var cell = gBoard[i][j]
//         for (var i = cell.i - 1; i <= cell.i + 1; i++) {
//             if (i < 0 || i > gBoard.length - 1) continue
//             for (var j = cell.j - 1; j <= cell.j + 1; j++) {
//                 if (i === cell.I && j === cell.J) continue;
//                 if (j < 0 || j > gBoard[0].length - 1) continue
//                 if (gHint) {
//                     elCell.innerText = gBoard[i][j].minesAroundCount
//                     elCell.classList.remove('mark')
//                 } else {
//                     elCell.innerText = 'gBoard[i][j].minesAroundCount'
//                     elCell.classList.add('mark')
//                 }
//             }
//         }
//     }
//     gHint = true
// }
// not full
function fullExpand(cell, board) {
    if (cell.isMine === true) return
    for (var i = cell.i - 2; i <= cell.i + 2; i++) {
        if (i < 0 || i > board.length - 1) continue
        for (var j = cell.j - 1; j <= cell.j + 1; j++) {
            if (i === cell.i && j === cell.j) continue;
            if (j < 0 || j > board[0].length - 1) continue
            if (board[i][j].isMine !== true) {
                var elCell = document.querySelector('.cell-' + i + '-' + j)
                elCell.innerText = board[i][j].minesAroundCount
                elCell.classList.remove('mark')
                if (!gBoard[i][j].isShown) {
                    gBoard[i][j].isShown = true
                    gGame.shownCount++
                }
            }
        }
    }
}

function cellMarked(elCell, i, j, ev) {
    if (ev.which === 3 && gBoard[i][j].isShown === false) {
        if (elCell.innerText === FLAG) {
            elCell.innerText = ''
            gBoard[i][j].isMarked = false
            gGame.markedCount--
        } else {
            elCell.innerText = FLAG
            gBoard[i][j].isMarked = true
            gGame.markedCount++
        }
    }
}

function checkGameOver() {
    if (gLevel.life === 0) {
        gGame.isOn = false
        clearInterval(gtimeInterval)
        console.log('gameoverrrrr');
    } else if (gGame.shownCount === (gLevel.SIZE * gLevel.SIZE - gLevel.MINES)) {
        var smiley = document.querySelector('.restart')
        smiley.innerText = '😎'
        gGame.isOn = false
        clearInterval(gtimeInterval)
        console.log('you won!!')
        bestScore()
    }
}

function bestScore() {
    var bestScore = document.querySelector('.bestscore')
    if (gGame.secsPassed < gRecord[0])
        gRecord.splice(0, 0, gGame.secsPassed)
    else if (gGame.secsPassed < gRecord[1])
        gRecord.splice(1, 0, gGame.secsPassed)
    else if (gGame.secsPassed < gRecord[2])
        gRecord.splice(2, 0, gGame.secsPassed)

    bestScore.innerHTML = `<span>Best score!</span> <br><br> 1. ${gRecord[0]}s`
    if (gRecord[1] > 0 && gRecord[1] !== Infinity) {
        bestScore.innerHTML += `<br> 2. ${gRecord[1]}s`
    }
    if (gRecord[2] > 0 && gRecord[2] !== Infinity) {
        bestScore.innerHTML += `<br> 3. ${gRecord[2]}s`
    }
    localStorage.setItem('highest score', bestScore.innerHTML)
    bestScore.innerHTML = localStorage.getItem('highest score')
}

function mineMaker(minesNum) {
    for (var k = 0; k < minesNum; k++) {
        var i = getRandomIntInclusive(0, gBoard.length - 2)
        var j = getRandomIntInclusive(0, gBoard.length - 2)
        if (!gBoard[i][j].isMine) {
            gBoard[i][j].isMine = true
        } else k--
    }
}

function chooseLvl(lvl) {
    if (lvl === 1) {
        gLevel.SIZE = 4
        gLevel.MINES = 3
    }
    if (lvl === 2) {
        gLevel.SIZE = 5
        gLevel.MINES = 4
    }
    if (lvl === 3) {
        gLevel.SIZE = 6
        gLevel.MINES = 5
    }
    if (lvl === 4) {
        gLevel.SIZE = 8
        gLevel.MINES = 8
    }
    init()
}

function timer() {

    gGame.secsPassed++
    var hours = Math.floor(gGame.secsPassed / 3600)
    var mins = Math.floor(gGame.secsPassed / 60) - (hours * 60)
    var secs = Math.floor(gGame.secsPassed % 60)
    var output = //hours.toString().padStart(2, '0') + ':' +
        mins.toString().padStart(2, '0') + ':'
        + secs.toString().padStart(2, '0')

    var clock = document.querySelector('.timer')
    clock.innerHTML = output
}

var gDarkMode = document.querySelector('.dark-mode-btn')
var gbody = document.querySelector('body')

function darkMode() {

    gbody.classList.toggle('dark-mode')
    if (gDarkMode.innerText === 'Light mode') {
        gDarkMode.innerText = 'Dark mode'
    } else gDarkMode.innerText = 'Light mode'
}

function mineExterminator() {
    if (gExterminatorTry) {
        var mines = []
        for (var i = 0; i < gBoard.length; i++) {
            for (var j = 0; j < gBoard[0].length; j++) {
                if (gBoard[i][j].isMine === true)
                    mines.push(gBoard[i][j])
            }
        }
        console.log(mines.length);
        for (var m = 0; m < 3; m++) {
            var mine = mines.splice(getRandomIntInclusive(0, mines.length - 1), 1)[0]
            mine.isMine = false
        }
        for (var i = 0; i <= gBoard.length - 1; i++) {
            for (var j = 0; j <= gBoard[0].length - 1; j++) {
                var cell = gBoard[i][j]
                cell.minesAroundCount = 0
                console.log(cell.minesNegsCount);
                minesNegsCount(cell, gBoard)
                if (cell.minesAroundCount === 0) {
                    cell.minesAroundCount = ''
                }
                if (cell.isShown === true) {
                    var elCell = document.querySelector('.cell-' + i + '-' + j)
                    elCell.innerText = cell.minesAroundCount
                }
            }
            var mineDec = document.querySelector('.mine-exterminator')
            mineDec.style.textDecoration = 'line-through'
        }
        gGame.shownCount -= 3
        gExterminatorTry = false
    }
}


function saveToStorage(key, val) {
    localStorage.setItem(key, JSON.stringify(val))
}

function loadFromStorage(key) {
    var val = localStorage.getItem(key)
    return JSON.parse(val)
}