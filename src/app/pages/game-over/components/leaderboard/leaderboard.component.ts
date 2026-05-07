import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaderboardPlayer } from '../../../../models/game.models';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeaderboardComponent {
  players = input<LeaderboardPlayer[]>([]);

  podium = computed(() => {
    const p = this.players();
    const top3 = p.slice(0, 3);
    // Rearrange for visual display: [2nd, 1st, 3rd]
    const result: (LeaderboardPlayer | null)[] = [null, null, null];
    if (top3[1]) result[0] = top3[1]; // 2nd
    if (top3[0]) result[1] = top3[0]; // 1st
    if (top3[2]) result[2] = top3[2]; // 3rd
    return result;
  });

  remaining = computed(() => {
    return this.players().slice(3);
  });
}
