function playHeroVideo(video: HTMLVideoElement): void {
  const playPromise = video.play();
  if (playPromise !== undefined) {
    playPromise.catch((): void => {});
  }
}

function handleHeroAction(action: string): void {
  if (action === 'open-learn-more') {
    document.dispatchEvent(new CustomEvent('modal:open', { detail: { id: 'learn-more' } }));
    return;
  }

  if (action === 'open-video-modal') {
    document.dispatchEvent(new CustomEvent('modal:open', { detail: { id: 'video-player' } }));
    return;
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
    const target = event.target as HTMLElement | null;
    if (!target) {
      return;
    }

    const actionElement = target.closest<HTMLElement>('[data-action]');
    if (!actionElement) {
      return;
    }

    const action = actionElement.dataset.action;
    if (action) {
      handleHeroAction(action);
    }
  });
}
