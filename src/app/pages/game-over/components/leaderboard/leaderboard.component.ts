import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaderboardPlayer } from '../../../../models/game.models';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.css'
})
export class LeaderboardComponent {
  @Input() players: LeaderboardPlayer[] = [];

  get podium() {
    const top3 = this.players.slice(0, 3);
    // Rearrange for visual display: [2nd, 1st, 3rd]
    const result: (LeaderboardPlayer | null)[] = [null, null, null];
    if (top3[1]) result[0] = top3[1]; // 2nd
    if (top3[0]) result[1] = top3[0]; // 1st
    if (top3[2]) result[2] = top3[2]; // 3rd
    return result;
  }

  get remaining() {
    return this.players.slice(3);
  }
}
