package com.bidflow.controller;

import com.bidflow.model.Meeting;
import com.bidflow.model.User;
import com.bidflow.service.MeetingService;
import com.bidflow.security.AuthHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/meetings")
@CrossOrigin(origins = "*")
public class MeetingController {

    @Autowired
    private MeetingService meetingService;

    @Autowired
    private AuthHelper authHelper;

    @PostMapping
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'ADMIN')")
    public ResponseEntity<Meeting> scheduleMeeting(@RequestBody Meeting meeting) {
        User user = authHelper.getCurrentUser();
        meeting.setEmployeeId(user.getId());
        meeting.setEmployeeName(user.getName());
        meeting.setEmployeeEmail(user.getEmail());
        Meeting created = meetingService.scheduleMeeting(meeting);
        return ResponseEntity.ok(created);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Meeting> getMeeting(@PathVariable String id) {
        Optional<Meeting> meeting = meetingService.getMeetingById(id);
        return meeting.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<Meeting>> getUserMeetings() {
        User user = authHelper.getCurrentUser();
        List<Meeting> meetings = meetingService.getUserMeetings(user.getId());
        return ResponseEntity.ok(meetings);
    }

    @GetMapping("/bid/{bidId}")
    public ResponseEntity<List<Meeting>> getMeetingsByBid(@PathVariable String bidId) {
        List<Meeting> meetings = meetingService.getMeetingsByBid(bidId);
        return ResponseEntity.ok(meetings);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Meeting> updateMeeting(
            @PathVariable String id,
            @RequestBody Meeting meeting) {
        Meeting updated = meetingService.updateMeeting(id, meeting);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Void> cancelMeeting(@PathVariable String id) {
        meetingService.cancelMeeting(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<Void> completeMeeting(@PathVariable String id) {
        meetingService.completeMeeting(id);
        return ResponseEntity.ok().build();
    }
}
