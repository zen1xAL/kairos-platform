type VideoAction = 'toggle' | 'mute' | 'fullscreen';

function playVideo(video: HTMLVideoElement): void {
  const playPromise = video.play();
  if (playPromise !== undefined) {
    playPromise.catch((): void => {});
  }
}

function syncPlayState(modal: HTMLDialogElement, video: HTMLVideoElement): void {
  const bigPlay = modal.querySelector<HTMLElement>('.video-modal__play-big');
  if (bigPlay) {
    bigPlay.dataset.hidden = String(!video.paused);
  }
}

function togglePlayback(video: HTMLVideoElement): void {
  if (video.paused) {
    playVideo(video);
  } else {
    video.pause();
  }
}

function toggleMute(button: HTMLElement, video: HTMLVideoElement): void {
  video.muted = !video.muted;
  button.dataset.muted = String(video.muted);
}

function toggleFullscreen(modal: HTMLDialogElement): void {
  if (document.fullscreenElement) {
    void document.exitFullscreen();
    return;
  }
  if (modal.requestFullscreen) {
    void modal.requestFullscreen();
  }
}

function handleVideoAction(modal: HTMLDialogElement, action: VideoAction, target: HTMLElement): void {
  const video = modal.querySelector<HTMLVideoElement>('.video-modal__video');
  if (!video) {
    return;
  }

  if (action === 'toggle') {
    togglePlayback(video);
    return;
  }

  if (action === 'mute') {
    toggleMute(target, video);
    return;
  }

  toggleFullscreen(modal);
}

function initVideoModal(modal: HTMLDialogElement): void {
  if (modal.dataset.initialized === 'true') {
    return;
  }
  modal.dataset.initialized = 'true';

  const video = modal.querySelector<HTMLVideoElement>('.video-modal__video');
  if (!video) {
    return;
  }

  modal.addEventListener('click', (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    if (target === video || target.closest('.video-modal__video')) {
      togglePlayback(video);
      return;
    }

    const control = target.closest<HTMLElement>('[data-video-action]');
    const action = control?.dataset.videoAction;
    if (control && (action === 'toggle' || action === 'mute' || action === 'fullscreen')) {
      handleVideoAction(modal, action, control);
    }
  });

  video.addEventListener('play', (): void => syncPlayState(modal, video));
  video.addEventListener('pause', (): void => syncPlayState(modal, video));
  modal.addEventListener('close', (): void => {
    video.pause();
    video.currentTime = 0;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    }
  });
}

function startVideoModal(modal: HTMLDialogElement): void {
  const video = modal.querySelector<HTMLVideoElement>('.video-modal__video');
  if (!video) {
    return;
  }
  playVideo(video);
  syncPlayState(modal, video);
}

const MODAL_IDS: Record<string, string> = {
  'learn-more': 'learn-more-modal',
  'video-player': 'video-modal',
};

function openModalById(id: string): void {
  const modalId = MODAL_IDS[id] ?? id;
  const modal = document.querySelector<HTMLDialogElement>(`#${modalId}`);
  if (!modal) {
    return;
  }

  modal.showModal();

  if (modalId === 'video-modal') {
    initVideoModal(modal);
    startVideoModal(modal);
  }
}

export function initModals(): void {
  document.addEventListener('modal:open', (event: Event): void => {
    const detail = (event as CustomEvent<{ id: string }>).detail;
    if (detail && typeof detail.id === 'string') {
      openModalById(detail.id);
    }
  });

  for (const modal of document.querySelectorAll<HTMLDialogElement>('dialog')) {
    modal.addEventListener('click', (event: MouseEvent): void => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      if (target.closest('[data-action="close-modal"]')) {
        modal.close();
      }
    });
  }
}
