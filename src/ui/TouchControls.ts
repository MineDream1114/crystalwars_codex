import type { GameState } from '../state/GameState';
import type { InputManager } from '../systems/InputManager';

interface TouchControlActions {
  onUse: () => void;
  onInteract: () => void;
}

export class TouchControls {
  private readonly root = document.createElement('div');
  private readonly joystick = document.createElement('div');
  private readonly joystickKnob = document.createElement('div');
  private readonly lookZone = document.createElement('div');
  private readonly jumpButton = document.createElement('button');
  private readonly interactButton = document.createElement('button');

  private joystickPointerId: number | null = null;
  private lookPointerId: number | null = null;
  private joystickCenter = { x: 0, y: 0 };
  private lookLast = { x: 0, y: 0 };
  private lookTravel = 0;
  private lookStartTime = 0;
  private readonly joystickRadius = 48;

  constructor(
    private readonly state: GameState,
    private readonly input: InputManager,
    private readonly actions: TouchControlActions
  ) {
    this.root.className = 'touch-controls hidden';
    this.lookZone.className = 'touch-look-zone';
    this.joystick.className = 'touch-joystick';
    this.joystickKnob.className = 'touch-joystick__knob';
    this.jumpButton.className = 'touch-button touch-button--jump';
    this.interactButton.className = 'touch-button touch-button--interact';
    this.jumpButton.type = 'button';
    this.interactButton.type = 'button';

    this.joystick.appendChild(this.joystickKnob);
    this.root.append(this.lookZone, this.joystick, this.jumpButton, this.interactButton);
    document.body.appendChild(this.root);

    this.lookZone.addEventListener('pointerdown', this.onLookStart);
    this.lookZone.addEventListener('pointermove', this.onLookMove);
    this.lookZone.addEventListener('pointerup', this.onLookEnd);
    this.lookZone.addEventListener('pointercancel', this.onLookEnd);

    this.joystick.addEventListener('pointerdown', this.onJoystickStart);
    this.joystick.addEventListener('pointermove', this.onJoystickMove);
    this.joystick.addEventListener('pointerup', this.onJoystickEnd);
    this.joystick.addEventListener('pointercancel', this.onJoystickEnd);

    this.jumpButton.addEventListener('pointerdown', this.onJumpStart);
    this.jumpButton.addEventListener('pointerup', this.onJumpEnd);
    this.jumpButton.addEventListener('pointercancel', this.onJumpEnd);
    this.jumpButton.addEventListener('pointerleave', this.onJumpEnd);

    this.interactButton.addEventListener('click', () => {
      this.actions.onInteract();
    });

    this.state.subscribe(() => this.render());
    this.render();
  }

  private render(): void {
    const isPlaying = this.state.phase === 'playing';
    this.root.classList.toggle(
      'hidden',
      !isPlaying || !this.input.isTouchDevice()
    );
    this.jumpButton.textContent = this.state.localizer.t('buttons.jump');
    this.interactButton.textContent = this.state.localizer.t('buttons.interact');
  }

  private onJoystickStart = (event: PointerEvent): void => {
    event.preventDefault();
    this.joystickPointerId = event.pointerId;
    this.joystick.setPointerCapture(event.pointerId);
    const rect = this.joystick.getBoundingClientRect();
    this.joystickCenter = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
    this.updateJoystick(event.clientX, event.clientY);
  };

  private onJoystickMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.joystickPointerId) {
      return;
    }
    this.updateJoystick(event.clientX, event.clientY);
  };

  private onJoystickEnd = (event: PointerEvent): void => {
    if (event.pointerId !== this.joystickPointerId) {
      return;
    }
    this.joystick.releasePointerCapture(event.pointerId);
    this.joystickPointerId = null;
    this.input.setVirtualMovement(0, 0);
    this.joystickKnob.style.transform = 'translate(-50%, -50%)';
  };

  private updateJoystick(clientX: number, clientY: number): void {
    const dx = clientX - this.joystickCenter.x;
    const dy = clientY - this.joystickCenter.y;
    const distance = Math.min(Math.hypot(dx, dy), this.joystickRadius);
    const angle = Math.atan2(dy, dx);
    const offsetX = Math.cos(angle) * distance;
    const offsetY = Math.sin(angle) * distance;

    this.input.setVirtualMovement(offsetX / this.joystickRadius, offsetY / this.joystickRadius);
    this.joystickKnob.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
  }

  private onLookStart = (event: PointerEvent): void => {
    if (this.lookPointerId !== null) {
      return;
    }
    if (
      event.target === this.jumpButton ||
      event.target === this.interactButton ||
      event.target === this.joystick ||
      event.target === this.joystickKnob
    ) {
      return;
    }

    this.lookPointerId = event.pointerId;
    this.lookTravel = 0;
    this.lookStartTime = performance.now();
    this.lookLast = { x: event.clientX, y: event.clientY };
    this.lookZone.setPointerCapture(event.pointerId);
  };

  private onLookMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.lookPointerId) {
      return;
    }

    const deltaX = event.clientX - this.lookLast.x;
    const deltaY = event.clientY - this.lookLast.y;
    this.lookLast = { x: event.clientX, y: event.clientY };
    this.lookTravel += Math.hypot(deltaX, deltaY);
    this.input.addLookDelta(deltaX, deltaY);
  };

  private onLookEnd = (event: PointerEvent): void => {
    if (event.pointerId !== this.lookPointerId) {
      return;
    }

    this.lookZone.releasePointerCapture(event.pointerId);
    const duration = performance.now() - this.lookStartTime;
    if (this.lookTravel < 10 && duration < 260) {
      this.actions.onUse();
    }

    this.lookPointerId = null;
    this.lookTravel = 0;
  };

  private onJumpStart = (event: PointerEvent): void => {
    event.preventDefault();
    this.jumpButton.setPointerCapture(event.pointerId);
    this.input.setVirtualJumpPressed(true);
  };

  private onJumpEnd = (event: PointerEvent): void => {
    if (this.jumpButton.hasPointerCapture(event.pointerId)) {
      this.jumpButton.releasePointerCapture(event.pointerId);
    }
    this.input.setVirtualJumpPressed(false);
  };
}
