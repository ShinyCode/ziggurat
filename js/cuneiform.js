settings = {
	DEEP_WEDGE_WIDTH: 32,
	SHALLOW_WEDGE_WIDTH: 16,
	DEEP_HOOK_WIDTH: 48,
	SHALLOW_HOOK_WIDTH: 24,
	MIN_LENGTH: 0.01,
	LENGTH_INTERVAL: 30,
	ANGLE_INTERVAL: 45
}

modes = {
	ADDING_WEDGE: 1,
	ADDING_HOOK: 2,
	ROTATING: 3,
	TRANSLATING: 4
}

state = {
	downPoint: null,
	group: null,
	drawingWedge: true,
	hookWidth: settings.DEEP_HOOK_WIDTH,
	wedgeWidth: settings.DEEP_WEDGE_WIDTH,
	deep: true,
	mode: modes.ADDING_WEDGE,
	discretizeLength: false,
	discretizeAngle: false
}

function addCuneiformSign(event) {
	if(state.group) state.group.selected = false
	state.downPoint = event.point
	if(state.drawingWedge) {
		// Draw the "head"
		const head = new paper.Path({
			segments: [event.point.add([-state.wedgeWidth / 2, -5 * state.wedgeWidth / 16]),
					   event.point.add([state.wedgeWidth / 2, -5 * state.wedgeWidth / 16]),
					   event.point.add([0, 5 * state.wedgeWidth / 16])],
			closed: true,
			fillColor: '#000000',
			name: 'head'
		})
		// Draw the "stalk"
		const stalk = new paper.Path.Rectangle({
			point: event.point.add([-5 * state.wedgeWidth / 64, 0]),
			size: new paper.Size(5 * state.wedgeWidth / 32, settings.MIN_LENGTH),
			fillColor: '#000000',
			name: 'stalk'
		})
		// Group both elements together
		state.group = new paper.Group(head, stalk)
		state.group.name = 'wedge'
		state.group.pivot = event.point
	} else {
		const hook = new paper.Path({
			segments: [event.point.add([-state.hookWidth / 2, -7 * state.hookWidth / 24]),
					   event.point.add([0, -state.hookWidth / 12]),
					   event.point.add([state.hookWidth / 2, -7 * state.hookWidth / 24]),
					   event.point.add([0, 7 * state.hookWidth / 24])],
			closed: true,
			fillColor: '#000000',
			name: 'hook'
		})
		hook.pivot = event.point
		state.group = hook
	}
}

function tweakCuneiformSign(event) {
	if(!state.group) return
	if(state.group.name === 'wedge') {
		const stalk = state.group.children['stalk']
		state.group.rotate(90 - stalk.position.subtract(state.group.pivot).angle)
		let targetLength = Math.max(event.point.subtract(state.group.pivot).length, settings.MIN_LENGTH)
		if(event.modifiers.control || state.discretizeLength) targetLength = Math.max(settings.LENGTH_INTERVAL, settings.LENGTH_INTERVAL * Math.round(targetLength / settings.LENGTH_INTERVAL))
		stalk.scale(1, targetLength / stalk.firstSegment.point.subtract(stalk.segments[1].point).length, state.group.pivot)
		let targetAngle = event.point.subtract(state.group.pivot).angle
		if(event.modifiers.shift || state.discretizeAngle) targetAngle = settings.ANGLE_INTERVAL * Math.round(targetAngle / settings.ANGLE_INTERVAL)
		state.group.rotate(targetAngle - stalk.position.subtract(state.group.pivot).angle)
	} else {
		let targetAngle = event.point.subtract(state.group.pivot).angle
		if(event.modifiers.shift || state.discretizeAngle) targetAngle = settings.ANGLE_INTERVAL * Math.round(targetAngle / settings.ANGLE_INTERVAL)
		state.group.rotate(targetAngle - state.group.lastSegment.point.subtract(state.group.pivot).angle)
	}
}

function moveCuneiformSign(event) {
	if(!state.group) return
	state.group.position = state.group.position.add(event.delta)
}

function selectCuneiformSign(event) {
	if(state.group) state.group.selected = false
	const hitResult = paper.project.hitTest(event.point)
	if(!hitResult) {
		state.group = null
		return
	}
	if(hitResult.item.name === 'stalk' || hitResult.item.name === 'head') {
		state.group = hitResult.item.parent
	} else {
		state.group = hitResult.item
	}
	state.group.selected = true
}

const addTool = new paper.Tool()
addTool.onMouseDown = addCuneiformSign
addTool.onMouseDrag = tweakCuneiformSign
addTool.activate()

const rotateTool = new paper.Tool()
rotateTool.onMouseDown = selectCuneiformSign
rotateTool.onMouseDrag = tweakCuneiformSign

const translateTool = new paper.Tool()
translateTool.onMouseDown = selectCuneiformSign
translateTool.onMouseDrag = moveCuneiformSign

window.onload = () => {
	resetMessage()
	setFontScale()
	expandMenuBar()
	const wedgeButton = document.getElementById('wedge-button')
	const hookButton = document.getElementById('hook-button')
	const rotateButton = document.getElementById('rotate-button')
	const translateButton = document.getElementById('translate-button')
	const angleButton = document.getElementById('angle-button')
	const lengthButton = document.getElementById('length-button')
	const depthButton = document.getElementById('depth-button')
	const clearButton = document.getElementById('clear-button')
	const menuButton = document.getElementById('tool-toggle')
	function setButtonActive(button, active) {
		const buttonContent = button.querySelector('.button-content')
		if(active) {
			buttonContent.classList.add('active')
		} else {
			buttonContent.classList.remove('active')
		}
	}
	function toggleButton(button) {
		const buttonContent = button.querySelector('.button-content')
		buttonContent.classList.toggle('active')
	}
	function activateModeButton(button) {
		setButtonActive(wedgeButton, false)
		setButtonActive(hookButton, false)
		setButtonActive(rotateButton, false)
		setButtonActive(translateButton, false)
		setButtonActive(button, true)
	}
	function bindActionListeners() {
		wedgeButton.addEventListener('click', event => {
			event.preventDefault()
			setMode(modes.ADDING_WEDGE)
			activateModeButton(wedgeButton)
		})
		wedgeButton.addEventListener('mouseenter', event => {
			displayMessage('Use this tool to draw a wedge by clicking and dragging the cursor.')
		})
		wedgeButton.addEventListener('mouseleave', event => {
			resetMessage()
		})
		hookButton.addEventListener('click', event => {
			event.preventDefault()
			setMode(modes.ADDING_HOOK)
			activateModeButton(hookButton)
		})
		hookButton.addEventListener('mouseenter', event => {
			displayMessage('Use this tool to draw a hook by clicking and dragging the cursor.')
		})
		hookButton.addEventListener('mouseleave', event => {
			resetMessage()
		})
		rotateButton.addEventListener('click', event => {
			event.preventDefault()
			setMode(modes.ROTATING)
			activateModeButton(rotateButton)
		})
		rotateButton.addEventListener('mouseenter', event => {
			displayMessage('Use this tool to adjust the rotation and length of different signs.')
		})
		rotateButton.addEventListener('mouseleave', event => {
			resetMessage()
		})
		translateButton.addEventListener('click', event => {
			event.preventDefault()
			setMode(modes.TRANSLATING)
			activateModeButton(translateButton)
		})
		translateButton.addEventListener('mouseenter', event => {
			displayMessage('Use this tool to move different signs around the canvas.')
		})
		translateButton.addEventListener('mouseleave', event => {
			resetMessage()
		})
		angleButton.addEventListener('click', event => {
			event.preventDefault()
			toggleAngleDiscretization()
			toggleButton(angleButton)
		})
		angleButton.addEventListener('mouseenter', event => {
			displayMessage('Selects whether to discretize all angles at intervals of 45&deg;.')
		})
		angleButton.addEventListener('mouseleave', event => {
			resetMessage()
		})
		lengthButton.addEventListener('click', event => {
			event.preventDefault()
			toggleLengthDiscretization()
			toggleButton(lengthButton)
		})
		lengthButton.addEventListener('mouseenter', event => {
			displayMessage('Selects whether to discretize the lengths of wedges.')
		})
		lengthButton.addEventListener('mouseleave', event => {
			resetMessage()
		})
		depthButton.addEventListener('click', event => {
			event.preventDefault()
			toggleDepth()
			toggleButton(depthButton)
		})
		depthButton.addEventListener('mouseenter', event => {
			displayMessage('Toggles whether signs should be deeper (larger) or shallower (smaller).')
		})
		depthButton.addEventListener('mouseleave', event => {
			resetMessage()
		})
		clearButton.addEventListener('click', event => {
			event.preventDefault()
			clearAll()
		})
		clearButton.addEventListener('mouseenter', event => {
			displayMessage('Clears and resets the entire canvas.')
		})
		clearButton.addEventListener('mouseleave', event => {
			resetMessage()
		})
		menuButton.addEventListener('click', event => {
			event.preventDefault()
			if(!screenIsSmall()) return
			if(menuBarIsOpen()) {
				collapseMenuBar()
			} else {
				expandMenuBar()
			}
		})
	}
	bindActionListeners()
	const canvas = document.getElementById('myCanvas')
	paper.setup(canvas)
	paper.view.onKeyDown = (event => {
		if(event.key === modes.ADDING_WEDGE.toString()) {
			setMode(modes.ADDING_WEDGE)
			activateModeButton(wedgeButton)
		} else if(event.key === modes.ADDING_HOOK.toString()) {
			setMode(modes.ADDING_HOOK)
			activateModeButton(hookButton)
		} else if(event.key === modes.ROTATING.toString()) {
			setMode(modes.ROTATING)
			activateModeButton(rotateButton)
		} else if(event.key === modes.TRANSLATING.toString()) {
			setMode(modes.TRANSLATING)
			activateModeButton(translateButton)
		} else if(event.key === 'delete') {
			deleteSelected()
		} else if(event.key === 'q') {
			toggleDepth()
			toggleButton(depthButton)
		} else if(event.key === 'x') {
			clearAll()
		} else if(event.key === 'shift') {
			setButtonActive(angleButton, true)
		} else if(event.key === 'control') {
			setButtonActive(lengthButton, true)
		}
	})
	paper.view.onKeyUp = (event => {
		if(event.key === 'shift') {
			setButtonActive(angleButton, state.discretizeAngle)
		} else if(event.key === 'control') {
			setButtonActive(lengthButton, state.discretizeLength)
		}
	})
	paper.view.draw()
}

function setMode(mode) {
	if(state.mode === mode) return
	state.mode = mode
	switch(mode) {
		case modes.ADDING_WEDGE:
			addTool.activate()
			setDeep(state.deep)
			state.drawingWedge = true
			console.log("Switched to wedge adding mode.")
			break
		case modes.ADDING_HOOK:
			addTool.activate()
			setDeep(state.deep)
			state.drawingWedge = false
			console.log("Switched to hook adding mode.")
			break
		case modes.ROTATING:
			rotateTool.activate()
			console.log("Switched to rotating mode.")
			break
		case modes.TRANSLATING:
			translateTool.activate()
			console.log("Switched to translating mode.")
			break
		default: // do nothing
			break
	}
}

function setDeep(deep) {
	state.deep = deep
	if(state.deep) {
		state.wedgeWidth = settings.DEEP_WEDGE_WIDTH
		state.hookWidth = settings.DEEP_HOOK_WIDTH
	} else {
		state.wedgeWidth = settings.SHALLOW_WEDGE_WIDTH
		state.hookWidth = settings.SHALLOW_HOOK_WIDTH
	}
}

function toggleDepth() {
	state.deep = !state.deep
	setDeep(state.deep)
	console.log("Toggled depth of impressions.")
}

function clearAll() {
	state.group = null
	paper.project.clear()
	console.log("Cleared canvas.")
}

function deleteSelected() {
	if(!state.group) return
	state.group.remove()
	state.group = null
	console.log("Deleted a group.")
}

function forceAngleDiscretization(setting) {
	state.discretizeAngle = setting
}

function toggleAngleDiscretization() {
	state.discretizeAngle = !state.discretizeAngle
}

function forceLengthDiscretization(setting) {
	state.discretizeLength = setting
}

function toggleLengthDiscretization() {
	state.discretizeLength = !state.discretizeLength
}

function displayMessage(msg) {
	const descriptionField = document.getElementById('desc-content')
	descriptionField.innerHTML = msg
}

function resetMessage() {
	const descriptionField = document.getElementById('desc-content')
	descriptionField.innerHTML = 'Mouse over a tool for more information. Hotkeys are displayed in the top-right corner of each tool.'
}

function setFontScale() {
	const body = document.querySelector('body')
	const sourceWidth = body.querySelector('.menu-bar').offsetWidth
	console.log(sourceWidth)
	const scale = 0.30
	body.style.fontSize = (scale * sourceWidth) + '%'
}

function screenIsSmall() {
 	return (document.documentElement.clientWidth < 992)
}

function collapseMenuBar() {
	const menuBar = document.querySelector('.menu-bar')
	const menuBarContainer = document.querySelector('.menu-bar-container')
	menuBarContainer.style.left = -menuBar.offsetWidth + 'px'
}

function expandMenuBar() {
	const menuBarContainer = document.querySelector('.menu-bar-container')
	menuBarContainer.style.left = '0px'
}

function menuBarIsOpen() {
	const menuBarContainer = document.querySelector('.menu-bar-container')
	return (menuBarContainer.style.left === '0px')
}

function adjustMenuBar() {
	if(screenIsSmall()) {
		collapseMenuBar()
	} else {
		expandMenuBar()
	}
}

window.onresize = function(event) {
	const canvas = document.getElementById('myCanvas')
	paper.view.viewSize.width = canvas.width
	paper.view.viewSize.height = canvas.height
	setFontScale()
	adjustMenuBar()
}
