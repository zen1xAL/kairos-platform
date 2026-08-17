function playHeroVideo(video: HTMLVideoElement): void {
  const playPromise = video.play();
  if (playPromise !== undefined) {
    playPromise.catch((): void => {});
  }
}

function handleHeroAction(action: string): void {
  const modalIds: Record<string, string> = {
    'open-learn-more': 'learn-more',
    'open-video-modal': 'video-player',
  };

  const id = modalIds[action];
  if (id) {
    document.dispatchEvent(new CustomEvent('modal:open', { detail: { id } }));
  }
}

export function initHero(): void {
  const video = document.querySelector<HTMLVideoElement>('.hero__video');
  if (video) {
    playHeroVideo(video);
  }

  const heroSection = document.querySelector<HTMLElement>('.hero');
  if (!heroSection) {
    return;
  }

  heroSection.addEventListener('click', (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const actionElement = target.closest<HTMLElement>('[data-action]');
    const action = actionElement?.dataset.action;
    if (action) {
      handleHeroAction(action);
    }
  });
}
